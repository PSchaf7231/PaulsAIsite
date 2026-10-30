import type { PaxState,Preference } from '../../lib/pax';
import { rememberListings } from '../../lib/pax-inventory';
import { searchInventory,getListing } from '../listings/service';
import { showMatches } from './search-criteria';
const city=(s:string)=>({delray:'Delray Beach',boynton:'Boynton Beach',boca:'Boca Raton','lake worth':'Lake Worth Beach'}[s.toLowerCase().trim()]||s);
export function inventoryFilters(p:Preference){return {mustHaves:p.mustHaves,propertyType:p.propertyType,city:p.area?city(p.area):undefined,areas:p.areas?.map(city),minPrice:p.minPrice,maxPrice:p.maxPrice,beds:p.beds,baths:p.baths,type:p.type};}
export async function queryInventory(state:PaxState){
 const data=await searchInventory(inventoryFilters(state.preferences));
 if(state.feedMode&&state.feedMode!==data.mode)state.listingRecords=[];
 state.feedMode=data.mode;state.feedCheckedAt=data.checkedAt;state.feedHasMore=data.hasMore;
 rememberListings(state,data.listings);const results=showMatches(state,data.listings);
 return {...results,feedMode:data.mode,limited:data.hasMore,...(data.mode==='unavailable'?{message:'The live MLS feed is temporarily unavailable. Do not invent results or show samples as live homes. Ask the visitor to retry or contact Paul.'}:{})};
}
export async function hydrateListing(state:PaxState,slug:string){const listing=await getListing(slug);if(listing)rememberListings(state,[listing]);return listing;}
