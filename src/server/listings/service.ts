import { fetchSpark,sparkConfigured } from './spark';
import { sampleListings } from './sample';
import { filterListings,type ListingFilters,type Listing } from '../../lib/listings';
export type InventoryResult={listings:Listing[];mode:'live'|'sample'|'unavailable';checkedAt:string;hasMore:boolean};
export async function searchInventory(filters:ListingFilters={},options:{limit?:number;lean?:boolean}={}):Promise<InventoryResult>{
 if(!sparkConfigured())return {listings:filterListings(sampleListings,filters),mode:'sample',checkedAt:new Date().toISOString(),hasMore:false};
 try{const result=await fetchSpark(filters,{limit:options.limit??500,lean:options.lean});return {...result,listings:filterListings(result.listings,filters),mode:'live'};}
 catch{return {listings:[],mode:'unavailable',checkedAt:new Date().toISOString(),hasMore:false};}
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
 const result=await fetchSpark({}, {listingId,limit:2});
 const normalize=(id:string)=>id.toLowerCase().replace(/[^a-z0-9]/g,'');
 return result.listings.find(l=>normalize(l.mlsNumber||'')===normalize(listingId))||null;
}
