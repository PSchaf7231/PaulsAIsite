import {cache} from 'react';
import {sparkConfigured,fetchSpark} from './spark';
import {sampleListings} from './sample';
import {searchStore,listingByMls,storeStatus,storeIsFresh,mapStore} from './store';
import type {MapBounds} from './rows';
import {filterListings,type ListingFilters,type Listing} from '../../lib/listings';
import {mapInventory,mapPayload,type MapPayload} from '../../lib/map-inventory';
export type InventoryResult={listings:Listing[];mode:'live'|'sample'|'unavailable';checkedAt:string;hasMore:boolean;total:number};
type Source={mode:'live';checkedAt:string}|{mode:'sample'}|{mode:'unavailable'};

// Live when the MLS table holds fresh rows. Without MLS credentials and without rows (local dev), use labeled samples.
export async function inventorySource():Promise<Source>{
 try{
  const status=await storeStatus();
  if(storeIsFresh(status))return {mode:'live',checkedAt:status.checkedAt!};
  if(status.rows>0||sparkConfigured())return {mode:'unavailable'};
 }catch{if(sparkConfigured())return {mode:'unavailable'};}
 return {mode:'sample'};
}

export async function searchInventory(filters:ListingFilters={},options:{limit?:number;lean?:boolean;offset?:number}={}):Promise<InventoryResult>{
 const offset=Math.max(0,options.offset??0),limit=Math.min(Math.max(1,options.limit??500),500);
 try{
  const source=await inventorySource();
  if(source.mode==='live'){
   const {listings,total}=await searchStore(filters,{limit,offset},source.checkedAt);
   return {listings,mode:'live',checkedAt:source.checkedAt,total,hasMore:offset+listings.length<total};
  }
  if(source.mode==='sample'){
   const matches=filterListings(sampleListings,filters);
   return {listings:matches.slice(offset,offset+limit).map(l=>({...l,photos:l.photos.slice(0,1)})),mode:'sample',checkedAt:new Date().toISOString(),total:matches.length,hasMore:offset+limit<matches.length};
  }
 }catch{/* fall through */}
 return {listings:[],mode:'unavailable',checkedAt:new Date().toISOString(),hasMore:false,total:0};
}

export async function mapListings(filters:ListingFilters={},bounds?:MapBounds):Promise<MapPayload&{mode:'live'|'sample';checkedAt:string}>{
 const source=await inventorySource();
 if(source.mode==='live')return {...await mapStore(filters,bounds),mode:'live',checkedAt:source.checkedAt};
 if(source.mode==='sample')return {...mapPayload(mapInventory(sampleListings,filters),bounds),mode:'sample',checkedAt:new Date().toISOString()};
 throw new Error('Map inventory unavailable.');
}

export function listingIdFromSlug(slug:string):string|null{
 if(!/^[a-z0-9-]{1,240}$/.test(slug))return null;
 // Prefer the MLS suffix; do not confuse a ZIP+4 or address number with the ID.
 const known=slug.match(/-((?:r|f|a|m|b|n|o|s|t|u)\d+|rx-\d+)$/i);
 if(known)return known[1];
 return slug.match(/-\d{5}(?:-\d{4})?-(.+)$/)?.[1]||null;
}

// One indexed row read by MLS number; if the row is missing or the database is unreachable, ask Spark for that one listing.
async function lookupListing(slug:string):Promise<Listing|null>{
 const listingId=listingIdFromSlug(slug);
 if(!listingId){
  return sparkConfigured()?null:filterListings(sampleListings).find(l=>l.slug===slug)||null;
 }
 let dbError:unknown;
 try{
  const source=await inventorySource();
  if(source.mode==='sample')return filterListings(sampleListings).find(l=>l.slug===slug)||null;
  const row=await listingByMls(listingId,source.mode==='live'?source.checkedAt:undefined);
  if(row)return row;
 }catch(error){dbError=error;}
 if(sparkConfigured()){
  const live=await fetchSpark({},{listingId,limit:5}).catch(error=>{throw dbError??error;});
  const normalize=(id:string)=>id.toLowerCase().replace(/[^a-z0-9]/g,'');
  return live.listings.find(l=>normalize(l.mlsNumber||'')===normalize(listingId))||null;
 }
 if(dbError)throw dbError;
 return filterListings(sampleListings).find(l=>l.slug===slug)||null;
}
// Deduplicates the metadata and page lookups within one request.
export const getListing=cache(lookupListing);
