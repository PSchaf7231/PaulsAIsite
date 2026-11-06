// Server/CLI only. Reads the complete MLS inventory from Spark in parallel pages.
// Storage is one row per listing (see sync.ts); the legacy single-row "ListingSnapshot" table is no longer written.
import type {Listing} from '../../lib/listings';
import {fetchSpark} from './spark';
type Snapshot={listings:Listing[];checkedAt:string};
export type Progress=(progress:{stage:string;recordsRead?:number;eligibleHomes?:number;elapsedSeconds?:number;batchMs?:number})=>void;
// Pages are read in parallel waves so a full inventory (~13,000-14,000 homes, ~70 pages) fits well inside the time budget.
const PAGE_SIZE=200,CONCURRENCY=6;
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
