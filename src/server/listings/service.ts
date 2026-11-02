import { fetchSpark,sparkConfigured } from './spark';
import { sampleListings } from './sample';
import { filterListings,type ListingFilters,type Listing } from '../../lib/listings';
export type InventoryResult={listings:Listing[];mode:'live'|'sample'|'unavailable';checkedAt:string;hasMore:boolean};
export async function searchInventory(filters:ListingFilters={},options:{limit?:number;lean?:boolean}={}):Promise<InventoryResult>{
 if(!sparkConfigured())return {listings:filterListings(sampleListings,filters),mode:'sample',checkedAt:new Date().toISOString(),hasMore:false};
 try{const result=await fetchSpark(filters,options);return {...result,listings:filterListings(result.listings,filters),mode:'live'};}
 catch{return {listings:[],mode:'unavailable',checkedAt:new Date().toISOString(),hasMore:false};}
}
export async function getListing(slug:string):Promise<Listing|null>{
 if(!sparkConfigured())return filterListings(sampleListings).find(l=>l.slug===slug)||null;
 if(!/^[a-z0-9-]{1,240}$/.test(slug))return null;
 const zip=Array.from(slug.matchAll(/-\d{5}(?:-\d{4})?-/g)).at(-1);if(!zip)return null;
 const listingId=slug.slice(zip.index!+zip[0].length);if(!listingId)return null;
 // An outage is an error, never an invented listing or a cached active status.
 const result=await fetchSpark({}, {listingId,limit:2});return result.listings.find(l=>l.mlsNumber?.toLowerCase()===listingId)||null;
}
