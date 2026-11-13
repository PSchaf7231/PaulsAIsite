import {z} from 'zod';
import type {ListingFilters} from './listings';
const amount=z.coerce.number().min(0).max(100000000).optional();
export const listingQuerySchema=z.object({
 city:z.string().max(80).optional(),
 type:z.preprocess(v=>typeof v==='string'?v.toUpperCase():v,z.enum(['SALE','RENT','COMMERCIAL']).optional()),
 propertyType:z.preprocess(v=>typeof v==='string'?(v.toLowerCase()==='single-family'?'HOUSE':v.toUpperCase()):v,z.enum(['HOUSE','CONDO','TOWNHOUSE','VILLA','MULTIFAMILY','LAND']).optional()),
 minPrice:amount,maxPrice:amount,beds:z.coerce.number().int().min(0).max(30).optional(),baths:z.coerce.number().min(0).max(30).optional(),pool:z.coerce.boolean().optional(),waterfront:z.coerce.boolean().optional(),garage:z.coerce.boolean().optional(),sort:z.enum(['price-asc','price-desc']).optional(),
 postalCode:z.string().regex(/^\d{5}$/).optional(),text:z.string().trim().min(1).max(120).optional()
}).strict();
export function cityHomeSearchUrl(city:string){return `/listings?${new URLSearchParams({city,type:'sale',propertyType:'single-family',minPrice:'1000000'})}`;}

export function listingPageFilters(params:Record<string,string|string[]|undefined>){
 const values=Object.fromEntries(Object.entries(params).filter(([key,value])=>['city','type','propertyType','minPrice','maxPrice','beds','baths','pool','waterfront','garage','sort','postalCode','text'].includes(key)&&typeof value==='string'));
 const parsed=listingQuerySchema.safeParse(values);
 return parsed.success?parsed.data:{};
}

export function initialListingFilters(params:Record<string,string|string[]|undefined>){
 const filters=listingPageFilters(params);
 const explicitSearch=(typeof params.q==='string'&&!!params.q.trim())||params.all==='1'||Object.keys(filters).some(key=>key!=='sort');
 return {...(!explicitSearch?{type:'SALE' as const,minPrice:750000,maxPrice:9999999,sort:'price-asc' as const}:{}),...filters};
}

// Typed search text beats whatever the URL or dropdowns already held: a typed town, ZIP, address or MLS number replaces
// the chosen place, and a typed sale/lease switch drops price limits that belonged to the other kind of search.
export function mergeTypedSearch(url:ListingFilters,typed?:ListingFilters,specificHome=false):ListingFilters{
 if(!typed||!Object.keys(typed).length)return url;
 // One specific home (street address or MLS number): ignore older filters so the home is found.
 if(specificHome)return {...typed};
 const base:ListingFilters={...url};
 if(typed.city||typed.postalCode||typed.text){delete base.city;delete base.postalCode;delete base.text;delete base.areas;}
 if(typed.type&&base.type&&typed.type!==base.type){delete base.minPrice;delete base.maxPrice;}
 return {...base,...typed};
}

// Query string for a listings search: every filter, the sort and the page, so Back and shared links restore it.
export function listingSearchParams(f:ListingFilters,page=1){
 const params=new URLSearchParams();
 const entries:[string,unknown][]=[['city',f.city],['type',f.type],['propertyType',f.propertyType],['minPrice',f.minPrice],['maxPrice',f.maxPrice],['beds',f.beds],['baths',f.baths],['pool',f.pool],['waterfront',f.waterfront],['garage',f.garage],['postalCode',f.postalCode],['text',f.text],['sort',f.sort]];
 for(const [key,value] of entries)if(value!==undefined&&value!==null&&value!==''&&value!==false)params.set(key,String(value));
 if(page>1)params.set('page',String(page));
 return params;
}
export function listingPageNumber(value:unknown){const n=Number(typeof value==='string'?value:1);return Number.isSafeInteger(n)&&n>=1&&n<=5000?n:1;}
