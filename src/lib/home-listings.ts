import type {Listing} from './listings';
export function featuredHomes(listings:Listing[]){return listings.filter(l=>!l.isSample&&l.status==='ACTIVE').sort((a,b)=>Date.parse(b.listedAt||b.updatedAt||'1970-01-01')-Date.parse(a.listedAt||a.updatedAt||'1970-01-01')).slice(0,6);}
