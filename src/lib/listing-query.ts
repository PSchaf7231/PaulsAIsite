import {z} from 'zod';
const amount=z.coerce.number().min(0).max(100000000).optional();
export const listingQuerySchema=z.object({
 city:z.string().max(80).optional(),
 type:z.preprocess(v=>typeof v==='string'?v.toUpperCase():v,z.enum(['SALE','RENT','COMMERCIAL']).optional()),
 propertyType:z.preprocess(v=>typeof v==='string'?(v.toLowerCase()==='single-family'?'HOUSE':v.toUpperCase()):v,z.enum(['HOUSE','CONDO','TOWNHOUSE','VILLA','MULTIFAMILY','LAND']).optional()),
 minPrice:amount,maxPrice:amount,beds:z.coerce.number().int().min(0).max(30).optional(),baths:z.coerce.number().min(0).max(30).optional(),sort:z.enum(['price-asc','price-desc']).optional()
}).strict();
export function cityHomeSearchUrl(city:string){return `/listings?${new URLSearchParams({city,type:'sale',propertyType:'single-family',minPrice:'1000000'})}`;}

export function listingPageFilters(params:Record<string,string|string[]|undefined>){
 const values=Object.fromEntries(Object.entries(params).filter(([key,value])=>['city','type','propertyType','minPrice','maxPrice','beds','baths','sort'].includes(key)&&typeof value==='string'));
 const defaults={type:'SALE' as const,propertyType:'HOUSE',minPrice:1000000,sort:'price-desc' as const};
 const explicit=['type','propertyType','minPrice','maxPrice'].some(key=>values[key]!==undefined);
 const parsed=listingQuerySchema.safeParse({...(!explicit?defaults:{}),sort:'price-desc',...values});
 return parsed.success?parsed.data:defaults;
}
