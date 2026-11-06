// Server only. Reads the one-row-per-listing MLS table with indexed WHERE/ORDER/LIMIT queries.
import {Pool} from 'pg';
import type {Listing,ListingFilters} from '../../lib/listings';
import {fromSummary,withDetail,whereClause,orderClause,normalizeMls,type MapBounds} from './rows';

let pool:Pool|undefined;
export function readDatabase(){
 return pool??=new Pool({connectionString:process.env.DIRECT_URL||process.env.DATABASE_URL,max:3,connectionTimeoutMillis:3000,statement_timeout:8000,idleTimeoutMillis:10000});
}
export async function closeReadDatabase(){await pool?.end();pool=undefined;}

export type StoreStatus={rows:number;checkedAt:string|null;lastCompleteAt:string|null};
let statusCache:{value:StoreStatus;until:number}|undefined;
// Freshness: rows are served while the latest successful sync is under 26 hours old (same rule as the old snapshot).
export const MAX_AGE_MS=26*60*60*1000;
export async function storeStatus():Promise<StoreStatus>{
 if(statusCache&&statusCache.until>Date.now())return statusCache.value;
 const {rows}=await readDatabase().query(`SELECT (SELECT count(*)::int FROM "MlsListing" WHERE "active") AS rows, s."lastSuccessAt", s."lastCompleteAt" FROM (SELECT 1) one LEFT JOIN "MlsSyncStatus" s ON s.id=1`);
 const r=rows[0]||{};
 const value={rows:r.rows||0,checkedAt:r.lastSuccessAt?new Date(r.lastSuccessAt).toISOString():null,lastCompleteAt:r.lastCompleteAt?new Date(r.lastCompleteAt).toISOString():null};
 statusCache={value,until:Date.now()+30000};return value;
}
export function storeIsFresh(status:StoreStatus){return status.rows>0&&!!status.checkedAt&&Date.now()-new Date(status.checkedAt).getTime()<=MAX_AGE_MS;}

export async function searchStore(filters:ListingFilters,{limit,offset}:{limit:number;offset:number},checkedAt?:string){
 const where=whereClause(filters),params=[...where.params,limit,offset];
 const db=readDatabase();
 const [page,count]=await Promise.all([
  db.query(`SELECT "summary" FROM "MlsListing" WHERE ${where.sql} ORDER BY ${orderClause(filters.sort)} LIMIT $${params.length-1} OFFSET $${params.length}`,params),
  db.query(`SELECT count(*)::int AS total FROM "MlsListing" WHERE ${where.sql}`,where.params)
 ]);
 return {listings:page.rows.map(r=>fromSummary(r.summary,checkedAt)) as Listing[],total:count.rows[0]?.total??0};
}

export type MapPin={id:string;slug:string;address:string;city:string;price:number;type:Listing['type'];isSample:boolean;latitude:number;longitude:number};
export const MAP_PIN_LIMIT=15000;
export async function mapStore(filters:ListingFilters,bounds?:MapBounds){
 const all=whereClause(filters),inBounds=whereClause(filters,bounds);
 const db=readDatabase();
 const [pins,counts]=await Promise.all([
  db.query(`SELECT "listingKey","slug","address","city","price","type","latitude","longitude" FROM "MlsListing" WHERE ${inBounds.sql} AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL ORDER BY "price" ASC LIMIT ${MAP_PIN_LIMIT}`,inBounds.params),
  db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE "latitude" IS NULL OR "longitude" IS NULL)::int AS missing FROM "MlsListing" WHERE ${all.sql}`,all.params)
 ]);
 const homes:MapPin[]=pins.rows.map(r=>({id:`spark-${r.listingKey}`,slug:r.slug,address:r.address,city:r.city,price:Number(r.price),type:r.type,isSample:false,latitude:Number(r.latitude),longitude:Number(r.longitude)}));
 return {homes,total:counts.rows[0]?.total??0,missingCoordinates:counts.rows[0]?.missing??0,truncated:pins.rows.length>=MAP_PIN_LIMIT};
}

export async function listingByMls(mlsId:string,checkedAt?:string):Promise<Listing|null>{
 const {rows}=await readDatabase().query(`SELECT "summary","detail" FROM "MlsListing" WHERE "mlsKey"=$1 AND "active" LIMIT 1`,[normalizeMls(mlsId)]);
 if(!rows[0])return null;
 return withDetail(fromSummary(rows[0].summary,checkedAt),rows[0].detail);
}

let cityCache:{value:string[];until:number}|undefined;
export async function knownCities():Promise<string[]>{
 if(cityCache&&cityCache.until>Date.now())return cityCache.value;
 const {rows}=await readDatabase().query(`SELECT DISTINCT "city" FROM "MlsListing" WHERE "active"`);
 const value=rows.map(r=>String(r.city)).filter(Boolean);
 cityCache={value,until:Date.now()+10*60*1000};return value;
}
export function resetStoreCaches(){statusCache=undefined;cityCache=undefined;}
