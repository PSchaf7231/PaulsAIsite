import { readSnapshot } from './snapshot';
import { sparkConfigured } from './spark';
import { sampleListings } from './sample';
import { filterListings,type ListingFilters,type Listing } from '../../lib/listings';
export type InventoryResult={listings:Listing[];mode:'live'|'sample'|'unavailable';checkedAt:string;hasMore:boolean;total:number};
export async function searchInventory(filters:ListingFilters={},options:{limit?:number;lean?:boolean;offset?:number}={}):Promise<InventoryResult>{
 try{
  const live=sparkConfigured();const source=live?await readSnapshot():{listings:sampleListings,checkedAt:new Date().toISOString()};
  const matches=filterListings(source.listings,filters),offset=options.offset??0,limit=options.limit??500;
  return {listings:matches.slice(offset,offset+limit).map(l=>({...l,photos:l.photos.slice(0,1)})),mode:live?'live':'sample',checkedAt:source.checkedAt,total:matches.length,hasMore:offset+limit<matches.length};
 }catch{return {listings:[],mode:'unavailable',checkedAt:new Date().toISOString(),hasMore:false,total:0};}
}
export function listingIdFromSlug(slug:string):string|null{
 if(!/^[a-z0-9-]{1,240}$/.test(slug))return null;
 // Prefer the MLS suffix; do not confuse a ZIP+4 or address number with the ID.
 const known=slug.match(/-((?:r|f|a|m|b|n|o|s|t|u)\d+|rx-\d+)$/i);
 if(known)return known[1];
 return slug.match(/-\d{5}(?:-\d{4})?-(.+)$/)?.[1]||null;
}
export async function getListing(slug:string):Promise<Listing|null>{
 if(!sparkConfigured())return filterListings(sampleListings).find(l=>l.slug===slug)||null;
 const listingId=listingIdFromSlug(slug);if(!listingId)return null;
 // Provider failures must surface as retryable errors, never a false property 404.
 const result=await readSnapshot();
 const normalize=(id:string)=>id.toLowerCase().replace(/[^a-z0-9]/g,'');
 return result.listings.find(l=>normalize(l.mlsNumber||'')===normalize(listingId))||null;
}
