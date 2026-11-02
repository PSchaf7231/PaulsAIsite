import type {Listing} from './listings';
// Never fill sale slots with cheaper homes, condos, or unverified property types.
export function featuredHomes(listings:Listing[],type:'SALE'|'RENT'){
 return listings.filter(l=>!l.isSample&&l.status==='ACTIVE'&&l.type===type&&(type==='RENT'?l.price>=3500:(l.propertyType==='HOUSE'&&l.price>=2000000))).sort((a,b)=>b.price-a.price).slice(0,6);
}
