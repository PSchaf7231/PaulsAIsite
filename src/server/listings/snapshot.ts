// Server/CLI only. A complete snapshot is published atomically; failed refreshes retain the old one.
import {Pool} from 'pg';
import type {Listing} from '../../lib/listings';
import {fetchSpark} from './spark';
type Snapshot={listings:Listing[];checkedAt:string};
let pool:Pool|undefined;
let memory:{snapshot:Snapshot;until:number}|undefined;
function database(){return pool??=new Pool({connectionString:process.env.DIRECT_URL||process.env.DATABASE_URL,max:2,connectionTimeoutMillis:1500,statement_timeout:2000});}
export async function readSnapshot():Promise<Snapshot>{
 if(memory&&memory.until>Date.now())return memory.snapshot;
 const {rows}=await database().query('SELECT "listings", "checkedAt" FROM "ListingSnapshot" WHERE id=1');
 if(!rows[0]||Date.now()-new Date(rows[0].checkedAt).getTime()>26*60*60*1000)throw new Error('Listing snapshot needs a successful refresh.');
 const snapshot={listings:rows[0].listings as Listing[],checkedAt:new Date(rows[0].checkedAt).toISOString()};
 memory={snapshot,until:Date.now()+30000};return snapshot;
}
type Progress=(progress:{stage:string;recordsRead?:number;eligibleHomes?:number;elapsedSeconds?:number})=>void;
// Pages are read in parallel waves so a full inventory (~6,600 homes, ~33 pages) fits well inside the time budget.
const PAGE_SIZE=200,CONCURRENCY=4;
export async function collectSnapshot(fetchPage=fetchSpark,onProgress?:Progress):Promise<Snapshot>{
 const rows=new Map<string,Listing>();let offset=0;const started=Date.now();
 for(;;){
  if(Date.now()-started>240000)throw new Error('Inventory refresh exceeded its time budget; previous snapshot retained.');
  const offsets=Array.from({length:CONCURRENCY},(_,i)=>offset+i*PAGE_SIZE);
  const pages=await Promise.all(offsets.map(o=>fetchPage({}, {limit:PAGE_SIZE,offset:o,fullPhotos:true})));
  let done=false;
  for(const page of pages){
   if(!page.rawCount&&page.hasMore)throw new Error('Inventory pagination did not advance.');
   for(const listing of page.listings)rows.set(listing.id,listing);
   offset+=page.rawCount;
   onProgress?.({stage:'MLS batch complete',recordsRead:offset,eligibleHomes:rows.size,elapsedSeconds:Math.round((Date.now()-started)/1000)});
   if(!page.hasMore){done=true;break;}
   if(page.rawCount<PAGE_SIZE)throw new Error('Inventory pagination returned a short page.');
  }
  if(done)break;
  if(offset>100000)throw new Error('Inventory refresh exceeded its safety limit.');
 }
 return {listings:[...rows.values()],checkedAt:new Date().toISOString()};
}
export async function refreshSnapshot(onProgress?:Progress){
 const client=await database().connect();
 onProgress?.({stage:'Database connected'});
 try{
  const lock=await client.query('SELECT pg_try_advisory_lock(733196970) AS locked');
  if(!lock.rows[0].locked)return {skipped:true};
  try{
   const snapshot=await collectSnapshot(fetchSpark,onProgress);
   onProgress?.({stage:'Saving complete snapshot',eligibleHomes:snapshot.listings.length});
   await client.query('INSERT INTO "ListingSnapshot" (id,listings,"checkedAt") VALUES (1,$1::jsonb,$2) ON CONFLICT (id) DO UPDATE SET listings=EXCLUDED.listings,"checkedAt"=EXCLUDED."checkedAt"',[JSON.stringify(snapshot.listings),snapshot.checkedAt]);
   memory=undefined;return {count:snapshot.listings.length,checkedAt:snapshot.checkedAt};
  }finally{await client.query('SELECT pg_advisory_unlock(733196970)');}
 }finally{client.release();}
}
export async function closeSnapshotDatabase(){await pool?.end();pool=undefined;}
