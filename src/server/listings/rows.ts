// Pure helpers that convert between the public Listing shape and one MlsListing database row.
import {searchTokens,type Listing,type ListingFilters} from '../../lib/listings';

export type ListingRow={
 listingKey:string;mlsNumber:string;mlsKey:string;slug:string;type:string;propertyType:string|null;price:number;
 beds:number|null;baths:number|null;sqft:number|null;address:string;city:string;postalCode:string;
 latitude:number|null;longitude:number|null;pool:boolean;waterfront:boolean;garage:boolean;amenities:Record<string,boolean>;
 searchText:string;listedAt:string|null;sourceUpdatedAt:string;summary:Record<string,unknown>;detail:Record<string,unknown>;
};
export type ListingDetail={description:string;photos:string[]};

export const normalizeMls=(id:string)=>id.toLowerCase().replace(/[^a-z0-9]/g,'');
export function listingKeyOf(listing:Listing){return listing.id.replace(/^spark-/,'');}
const finite=(value:unknown)=>{const n=typeof value==='string'&&value.trim()!==''?Number(value):value;return typeof n==='number'&&Number.isFinite(n)?n:null;};
// Postgres int4 columns reject decimals and huge values; round and bound them instead of failing the whole batch.
const int4=(value:unknown)=>{const n=finite(value);if(n===null)return null;const r=Math.round(n);return r>=0&&r<=2147483647?r:null;};
const isoOrNull=(value:unknown)=>{if(!value)return null;const d=new Date(String(value));return Number.isNaN(d.getTime())?null:d.toISOString();};

// Card summary: everything a card, the map, Madison's result list and filters need, with only the first photo and no long description.
export function toRow(listing:Listing):ListingRow{
 const missing=new Set(listing.missingFields||[]);
 const lat=finite(listing.latitude),lng=finite(listing.longitude);
 const validCoords=lat!==null&&lng!==null&&Math.abs(lat)<=90&&Math.abs(lng)<=180;
 const amenities=listing.verifiedAmenities||{};
 const {description,photos,...rest}=listing;
 const summary={...rest,description:'',photos:photos.slice(0,1)};
 const detail:ListingDetail={description,photos:photos.map(p=>p.url)};
 return {
  listingKey:listingKeyOf(listing),mlsNumber:String(listing.mlsNumber||''),mlsKey:normalizeMls(listing.mlsNumber||listingKeyOf(listing)),slug:listing.slug||listingKeyOf(listing),
  type:listing.type||'sale',propertyType:listing.propertyType||null,price:finite(listing.price)??0,
  beds:missing.has('beds')?null:int4(listing.beds),baths:missing.has('baths')?null:finite(listing.baths),sqft:missing.has('sqft')?null:int4(listing.sqft),
  address:listing.address||'',city:listing.city||'',postalCode:String(listing.postalCode||'').slice(0,5),
  latitude:validCoords?lat:null,longitude:validCoords?lng:null,
  pool:!!amenities.pool,waterfront:!!amenities.waterfront,garage:!!amenities.garage,amenities,
  searchText:[listing.address,listing.city,listing.postalCode,listing.mlsNumber||''].join(' ').toLowerCase().replace(/\s+/g,' ').trim(),
  listedAt:isoOrNull(listing.listedAt),sourceUpdatedAt:isoOrNull(listing.updatedAt)||new Date(0).toISOString(),summary,detail
 };
}

export function fromSummary(summary:Record<string,unknown>,checkedAt?:string):Listing{
 const listing=summary as unknown as Listing;
 return {...listing,checkedAt:checkedAt||listing.checkedAt};
}
export function withDetail(summary:Listing,detail:Partial<ListingDetail>|null|undefined):Listing{
 const urls=Array.isArray(detail?.photos)?detail!.photos:[];
 return {...summary,description:typeof detail?.description==='string'?detail.description:summary.description,
  photos:urls.length?urls.map((url,i)=>({url,alt:`${summary.address} — MLS photo ${i+1}`,position:i})):summary.photos};
}

// Builds a parameterised WHERE clause for every supported filter. Values never reach the SQL text.
export type MapBounds={north:number;south:number;east:number;west:number};
export function whereClause(f:ListingFilters={},bounds?:MapBounds){
 const params:unknown[]=[],parts=['"active"',`("type"='SALE' OR ("type"='RENT' AND "price">=3500))`];
 const p=(value:unknown)=>{params.push(value);return `$${params.length}`;};
 if(f.city)parts.push(`lower("city")=lower(${p(f.city)})`);
 if(f.areas?.length)parts.push(`lower("city") = ANY(${p(f.areas.map(a=>a.toLowerCase()))}::text[])`);
 if(f.type)parts.push(`"type"=${p(f.type)}`);
 if(f.propertyType)parts.push(`"propertyType"=${p(f.propertyType)}`);
 if(f.minPrice!=null)parts.push(`"price">=${p(f.minPrice)}`);
 if(f.maxPrice!=null)parts.push(`"price"<=${p(f.maxPrice)}`);
 if(f.beds!=null)parts.push(`"beds">=${p(f.beds)}`);
 if(f.baths!=null)parts.push(`"baths">=${p(f.baths)}`);
 if(f.pool)parts.push('"pool"');
 if(f.waterfront)parts.push('"waterfront"');
 if(f.garage)parts.push('"garage"');
 const must:Record<string,string>={'private pool':'"pool"',pool:'"pool"',waterfront:'"waterfront"',garage:'"garage"','no hoa':`("amenities"->>'no hoa')='true'`,'55+':`("amenities"->>'55+')='true'`};
 for(const term of f.mustHaves||[]){const clause=must[term.toLowerCase().trim()];if(clause)parts.push(clause);}
 if(f.postalCode)parts.push(`"postalCode"=${p(f.postalCode.slice(0,5))}`);
 if(f.text){
  for(const token of searchTokens(f.text))parts.push(`"searchText" LIKE ${p(`%${token.replace(/[\\%_]/g,m=>'\\'+m)}%`)}`);
 }
 if(bounds)parts.push(`"latitude" BETWEEN ${p(bounds.south)} AND ${p(bounds.north)}`,`"longitude" BETWEEN ${p(bounds.west)} AND ${p(bounds.east)}`);
 return {sql:parts.join(' AND '),params};
}
export function orderClause(sort?:ListingFilters['sort']){
 return sort==='price-desc'?'"price" DESC, "listingKey" DESC':sort==='price-asc'?'"price" ASC, "listingKey" ASC':'"sourceUpdatedAt" DESC, "listingKey" ASC';
}
