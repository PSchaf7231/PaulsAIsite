// Server/CLI only. Downloads the complete MLS inventory, then writes it one row per listing in small batches.
// Only new or changed listings are written; unchanged rows are just marked as seen. Work stops cleanly at the
// time budget and the next run resumes (rows are independent), so a slow database never blocks a deploy.
import {Pool,type PoolClient} from 'pg';
import type {Listing} from '../../lib/listings';
import {fetchSpark} from './spark';
import {toRow,listingKeyOf,type ListingRow} from './rows';
import {collectSnapshot,type Progress} from './snapshot';
import {snapshotErrorDetail} from './snapshot-errors';
import {resetStoreCaches} from './store';

export const BATCH_SIZE=250;
const LOCK_ID=733196971;
let pool:Pool|undefined;
function writeDatabase(){
 return pool??=new Pool({connectionString:process.env.DIRECT_URL||process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000,statement_timeout:90000});
}
export async function closeSyncDatabase(){await pool?.end();pool=undefined;}

const COLUMNS=['listingKey','mlsNumber','mlsKey','slug','type','propertyType','price','beds','baths','sqft','address','city','postalCode','latitude','longitude','pool','waterfront','garage','amenities','searchText','listedAt','sourceUpdatedAt','summary','detail'] as const;
const CASTS:Record<string,string>={listingKey:'text',mlsNumber:'text',mlsKey:'text',slug:'text',type:'text',propertyType:'text',price:'float8',beds:'int4',baths:'float8',sqft:'int4',address:'text',city:'text',postalCode:'text',latitude:'float8',longitude:'float8',pool:'bool',waterfront:'bool',garage:'bool',amenities:'jsonb',searchText:'text',listedAt:'timestamptz',sourceUpdatedAt:'timestamptz',summary:'jsonb',detail:'jsonb'};
const JSON_COLUMNS=new Set(['amenities','summary','detail']);

// One INSERT ... SELECT FROM unnest(...) per batch: 24 array parameters regardless of batch size.
export function upsertStatement(rows:ListingRow[],seenAt:string){
 const params=COLUMNS.map(column=>rows.map(row=>{const value=row[column];return JSON_COLUMNS.has(column)?JSON.stringify(value):value;}));
 params.push(seenAt as never);
 const cols=COLUMNS.map(c=>`"${c}"`).join(',');
 const unnest=COLUMNS.map((c,i)=>`$${i+1}::${CASTS[c]==='jsonb'?'text':CASTS[c]}[]`).join(',');
 const select=COLUMNS.map(c=>CASTS[c]==='jsonb'?`u."${c}"::jsonb`:`u."${c}"`).join(',');
 const seen=`$${COLUMNS.length+1}::timestamptz`;
 const updates=COLUMNS.filter(c=>c!=='listingKey').map(c=>`"${c}"=EXCLUDED."${c}"`).join(',');
 const sql=`INSERT INTO "MlsListing" (${cols},"active","lastSeenAt","updatedAt") SELECT ${select},true,${seen},now() FROM unnest(${unnest}) AS u(${cols}) ON CONFLICT ("listingKey") DO UPDATE SET ${updates},"active"=true,"lastSeenAt"=EXCLUDED."lastSeenAt","updatedAt"=now()`;
 return {sql,params};
}

export type SyncResult={skipped?:boolean;reason?:string;count?:number;written?:number;rejected?:number;unchanged?:number;remaining?:number;deactivated?:number;complete?:boolean;checkedAt?:string;elapsedSeconds?:number};
type SyncOptions={budgetMs?:number;trigger?:string;onProgress?:Progress;collect?:typeof collectSnapshot;now?:()=>number};

async function writeStatus(client:PoolClient,values:Record<string,unknown>){
 const keys=Object.keys(values);
 await client.query(`INSERT INTO "MlsSyncStatus" (id,${keys.map(k=>`"${k}"`).join(',')}) VALUES (1,${keys.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT (id) DO UPDATE SET ${keys.map(k=>`"${k}"=EXCLUDED."${k}"`).join(',')}`,keys.map(k=>values[k]));
}

export async function syncListings(options:SyncOptions={}):Promise<SyncResult>{
 const now=options.now||Date.now,started=now(),budget=options.budgetMs??270000,onProgress=options.onProgress;
 const elapsed=()=>Math.round((now()-started)/1000);
 const client=await writeDatabase().connect();
 onProgress?.({stage:'Database connected'});
 try{
  const lock=await client.query('SELECT pg_try_advisory_lock($1) AS locked',[LOCK_ID]);
  if(!lock.rows[0]?.locked)return {skipped:true,reason:'Another refresh is running.'};
  try{
   const runAt=new Date(started).toISOString();
   try{
    const snapshot=await (options.collect||collectSnapshot)(fetchSpark,onProgress);
    const seenAt=snapshot.checkedAt;
    const listings=dedupe(snapshot.listings);
    onProgress?.({stage:'MLS download complete',eligibleHomes:listings.length,elapsedSeconds:elapsed()});
    // Compare against stored modification times so unchanged homes are not re-sent.
    const existing=await client.query(`SELECT "listingKey", "sourceUpdatedAt", "active" FROM "MlsListing"`);
    const stored=new Map<string,{updated:number;active:boolean}>(existing.rows.map(r=>[String(r.listingKey),{updated:new Date(r.sourceUpdatedAt).getTime(),active:!!r.active}]));
    const changed:Listing[]=[],unchangedKeys:string[]=[];
    for(const listing of listings){const key=listingKeyOf(listing),prev=stored.get(key);if(prev&&prev.active&&prev.updated===new Date(listing.updatedAt||0).getTime())unchangedKeys.push(key);else changed.push(listing);}
    for(let i=0;i<unchangedKeys.length;i+=5000)await client.query(`UPDATE "MlsListing" SET "lastSeenAt"=$2 WHERE "listingKey" = ANY($1::text[])`,[unchangedKeys.slice(i,i+5000),seenAt]);
    onProgress?.({stage:'Writing changed listings',eligibleHomes:changed.length,elapsedSeconds:elapsed()});
    let written=0,rejected=0;
    for(let i=0;i<changed.length;i+=BATCH_SIZE){
     if(now()-started>budget)break;
     const batch=changed.slice(i,i+BATCH_SIZE).map(toRow),t=now(),statement=upsertStatement(batch,seenAt);
     // A relisted home can reuse an MLS number under a new ListingKey; drop the stale row so mlsKey stays unique.
     try{
      await client.query('BEGIN');
      await client.query(`DELETE FROM "MlsListing" WHERE "mlsKey" = ANY($1::text[]) AND NOT ("listingKey" = ANY($2::text[]))`,[batch.map(r=>r.mlsKey),batch.map(r=>r.listingKey)]);
      await client.query(statement.sql,statement.params);
      await client.query('COMMIT');
      written+=batch.length;
     }catch(batchError){
      await client.query('ROLLBACK').catch(()=>undefined);
      // One bad record must not stop the sync: retry this batch one home at a time and skip only the rows Postgres rejects.
      onProgress?.({stage:'Batch rejected; retrying one home at a time',detail:dbErrorDetail(batchError)});
      for(const row of batch){
       try{
        await client.query('BEGIN');
        await client.query(`DELETE FROM "MlsListing" WHERE "mlsKey" = $1 AND "listingKey" <> $2`,[row.mlsKey,row.listingKey]);
        const single=upsertStatement([row],seenAt);await client.query(single.sql,single.params);
        await client.query('COMMIT');written++;
       }catch(rowError){
        await client.query('ROLLBACK').catch(()=>undefined);rejected++;
        if(rejected<=10)onProgress?.({stage:'Skipped listing',listingKey:row.listingKey,detail:dbErrorDetail(rowError)});
       }
      }
     }
     onProgress?.({stage:'Saved batch',recordsRead:written,eligibleHomes:changed.length,elapsedSeconds:elapsed(),batchMs:now()-t});
    }
    const processed=written+rejected,remaining=changed.length-processed,complete=remaining===0;
    let deactivated=0;
    if(complete){
     // Safety: never wipe the table because of an implausibly small pull.
     const activeBefore=[...stored.values()].filter(v=>v.active).length;
     if(listings.length>=Math.floor(activeBefore*0.5)){
      const result=await client.query(`UPDATE "MlsListing" SET "active"=false,"updatedAt"=now() WHERE "active" AND "lastSeenAt" < $1`,[seenAt]);
      deactivated=result.rowCount||0;
      await client.query(`DELETE FROM "MlsListing" WHERE NOT "active" AND "lastSeenAt" < now() - interval '30 days'`);
     }else onProgress?.({stage:'Skipped deactivation: pull much smaller than stored inventory',eligibleHomes:listings.length});
    }
    const active=await client.query(`SELECT count(*)::int AS n FROM "MlsListing" WHERE "active"`);
    await writeStatus(client,{lastRunAt:runAt,lastSuccessAt:seenAt,...(complete?{lastCompleteAt:seenAt}:{}),activeCount:active.rows[0].n,sourceCount:listings.length,written,deactivated,complete,durationMs:now()-started,error:null,trigger:options.trigger||null});
    resetStoreCaches();
    return {count:listings.length,written,rejected,unchanged:unchangedKeys.length,remaining,deactivated,complete,checkedAt:seenAt,elapsedSeconds:elapsed()};
   }catch(error){
    await writeStatus(client,{lastRunAt:runAt,complete:false,durationMs:now()-started,error:snapshotErrorDetail(error),trigger:options.trigger||null}).catch(()=>undefined);
    throw error;
   }
  }finally{await client.query('SELECT pg_advisory_unlock($1)',[LOCK_ID]).catch(()=>undefined);}
 }finally{client.release();}
}
function dedupe(listings:Listing[]){
 // mlsKey is unique in the table; keep the most recently modified record per MLS number.
 const byMls=new Map<string,Listing>();
 for(const l of listings){const k=toRow(l).mlsKey,prev=byMls.get(k);if(!prev||new Date(l.updatedAt||0)>new Date(prev.updatedAt||0))byMls.set(k,l);}
 const byKey=new Map<string,Listing>();for(const l of byMls.values())byKey.set(listingKeyOf(l),l);
 return [...byKey.values()];
}

// Postgres data/constraint errors (classes 21, 22, 23) name a column or constraint, never credentials.
function dbErrorDetail(error:unknown){const e=error as {code?:string;message?:string};return e?.code&&/^2[123]/.test(e.code)?`${e.code}: ${String(e.message||'').slice(0,200)}`:snapshotErrorDetail(error);}

export async function activeListingCount(){
 const {rows}=await writeDatabase().query(`SELECT count(*)::int AS n FROM "MlsListing" WHERE "active"`);
 return rows[0]?.n??0;
}

export async function syncStatus(){
 const {rows}=await writeDatabase().query(`SELECT * FROM "MlsSyncStatus" WHERE id=1`);
 return rows[0]||null;
}
