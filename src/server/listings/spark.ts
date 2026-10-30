// Adapted from PSchaf7231/hobson-concierge/lib/spark.js (033e879).
// Server only: Node crypto and this module must never be imported by client components.
import { createHash } from 'node:crypto';
import type { Listing,ListingFilters } from '../../lib/listings';
import { englishLabel } from '../../lib/property-details';
const DEFAULT_BASE='https://replication.sparkapi.com/Version/3/Reso/OData';
export function sparkToken(){return process.env.SPARK_ACCESS_TOKEN||process.env.SPARK_API_TOKEN||'';}
export function sparkConfigured(){return !!sparkToken();}

const text=(v:unknown)=>typeof v==='string'?v.trim():'';
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:typeof v==='string'&&v.trim()&&Number.isFinite(Number(v))?Number(v):null;
const words=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const quote=(v:string)=>`'${v.replace(/'/g,"''")}'`;
export function sparkFilter(f:ListingFilters={},listingId?:string){
 const parts=["StandardStatus eq 'Active'","CountyOrParish eq 'Palm Beach'"];
 if(listingId)parts.push(`(ListingId eq ${quote(listingId.toUpperCase())} or ListingId eq ${quote(listingId.toLowerCase())})`);
 const cities=f.areas?.length?f.areas:f.city?[f.city]:[];
 if(cities.length)parts.push(`(${cities.map(city=>`City eq ${quote(city)}`).join(' or ')})`);
 for(const term of f.mustHaves||[]){const t=term.toLowerCase().trim();const clause:Record<string,string>={'private pool':'PoolPrivateYN eq true','waterfront':'WaterfrontYN eq true','garage':'GarageSpaces gt 0','no hoa':'AssociationYN eq false','55+':'SeniorCommunityYN eq true'};if(clause[t])parts.push(clause[t]);}
 const subtype:Record<string,string>={HOUSE:'Single Family Residence',CONDO:'Condominium',TOWNHOUSE:'Townhouse',VILLA:'Villa'};if(f.propertyType&&subtype[f.propertyType])parts.push(`PropertySubType eq ${quote(subtype[f.propertyType])}`);
 if(f.type==='RENT')parts.push("(PropertyType eq 'Residential Lease' or PropertyType eq 'Commercial Lease')");
 if(f.type==='SALE')parts.push("PropertyType eq 'Residential'");
 if(f.type==='COMMERCIAL')parts.push("PropertyType eq 'Commercial Sale'");
 for(const [key,field,op] of [['minPrice','ListPrice','ge'],['maxPrice','ListPrice','le'],['beds','BedroomsTotal','ge'],['baths','BathroomsTotalInteger','ge']] as const){const value=f[key];if(value!=null&&Number.isFinite(value)&&value>=0)parts.push(`${field} ${op} ${value}`);}
 return parts.join(' and ');
}
export function mapSpark(r:Record<string,unknown>,checkedAt:string):Listing|null{
 if(r.InternetEntireListingDisplayYN===false||r.InternetAddressDisplayYN===false||text(r.StandardStatus).toLowerCase()!=='active'||!/^palm\s*beach$/i.test(text(r.CountyOrParish)))return null;
 const id=text(r.ListingId),key=text(r.ListingKey),office=text(r.ListOfficeName),price=number(r.ListPrice);
 const address=[text(r.StreetNumber),text(r.StreetDirPrefix),text(r.StreetName),text(r.StreetSuffix),text(r.StreetDirSuffix),r.UnitNumber?`Unit ${text(r.UnitNumber)}`:''].filter(Boolean).join(' ');
 const city=text(r.City),zip=text(r.PostalCode),modified=text(r.ModificationTimestamp);
 if(!id||!key||!office||price===null||!address||!city||!/^\d{5}(?:-\d{4})?$/.test(zip)||!Number.isFinite(Date.parse(modified)))return null;
 const category=text(r.PropertyType),subtype=text(r.PropertySubType);const type=/lease/i.test(category)?'RENT':/commercial/i.test(category)?'COMMERCIAL':'SALE';
 const media=Array.isArray(r.Media)?r.Media as Record<string,unknown>[]:[];
 const photos=media.filter(m=>{try{const url=new URL(text(m.MediaURL));return url.protocol==='https:'&&!url.username&&!url.password&&(!m.MediaCategory||/photo/i.test(text(m.MediaCategory)));}catch{return false;}}).sort((a,b)=>(number(a.Order)||0)-(number(b.Order)||0)).slice(0,40).map((m,i)=>({url:text(m.MediaURL),alt:`${address} — MLS photo ${i+1}`,position:i}));
 const features=['InteriorFeatures','ExteriorFeatures','ParkingFeatures','PoolFeatures','WaterfrontFeatures','CommunityFeatures'].flatMap(field=>Array.isArray(r[field])?(r[field] as unknown[]).map(text):text(r[field])?[text(r[field])]:[]).filter(Boolean).map(englishLabel);
 const amenities:Record<string,boolean>={};
 if(typeof r.PoolPrivateYN==='boolean'){amenities['private pool']=r.PoolPrivateYN;if(r.PoolPrivateYN)amenities.pool=true;}
 if(typeof r.SeniorCommunityYN==='boolean')amenities['55+']=r.SeniorCommunityYN;
 if(typeof r.WaterfrontYN==='boolean')amenities.waterfront=r.WaterfrontYN;
 if(typeof r.AssociationYN==='boolean'){amenities.hoa=r.AssociationYN;amenities['no hoa']=!r.AssociationYN;}
 if(number(r.GarageSpaces)!==null)amenities.garage=Number(r.GarageSpaces)>0;
 for(const [label,value] of Object.entries(amenities))if(value&&!['hoa','pool'].includes(label))features.push(englishLabel(label));
 const propertyType=/single family/i.test(subtype)?'HOUSE':/condominium/i.test(subtype)?'CONDO':/townhouse/i.test(subtype)?'TOWNHOUSE':/villa/i.test(subtype)?'VILLA':/multi/i.test(subtype)?'MULTIFAMILY':/land/i.test(category)?'LAND':undefined;
 const listed=text(r.OriginalEntryTimestamp)||text(r.OnMarketDate)||text(r.ListingContractDate);
 return {listedAt:listed&&Number.isFinite(Date.parse(listed))?new Date(listed).toISOString():undefined,id:`spark-${key}`,mlsNumber:id,slug:`${words(address)}-${words(city)}-${zip}-${words(id)}`,title:address,address,city,postalCode:zip,price,beds:number(r.BedroomsTotal)??0,baths:number(r.BathroomsTotalInteger)??0,sqft:number(r.LivingArea)??0,missingFields:['beds','baths','sqft'].filter((_,i)=>number([r.BedroomsTotal,r.BathroomsTotalInteger,r.LivingArea][i])===null),latitude:number(r.Latitude),longitude:number(r.Longitude),type,status:'ACTIVE',description:text(r.PublicRemarks),features:[...new Set(features)],propertyType,verifiedAmenities:amenities,source:'BEACHESMLS',attribution:`Listing courtesy of ${office}`,office,isSample:false,photos,updatedAt:new Date(modified).toISOString(),checkedAt};
}
export type SparkResult={listings:Listing[];checkedAt:string;hasMore:boolean};
const cache=new Map<string,{until:number;result:SparkResult}>();
export async function fetchSpark(filters:ListingFilters={},options:{listingId?:string;limit?:number;lean?:boolean;offset?:number}={},fetcher:typeof fetch=fetch):Promise<SparkResult>{
 const token=sparkToken();if(!token)throw new Error('Spark is not configured.');
 const base=new URL(process.env.SPARK_API_BASE||DEFAULT_BASE);if(base.protocol!=='https:'||!(base.hostname==='sparkapi.com'||base.hostname.endsWith('.sparkapi.com')))throw new Error('Invalid Spark endpoint.');
 const limit=Math.min(options.limit||500,5000),key=createHash('sha256').update(JSON.stringify([token,base.href,filters,options])).digest('hex');
 const cached=cache.get(key);if(fetcher===fetch&&cached&&cached.until>Date.now())return cached.result;
 const url=new URL(base.href.replace(/\/$/,'')+'/Property');url.searchParams.set('$filter',sparkFilter(filters,options.listingId));url.searchParams.set('$top',String(Math.min(200,limit)));url.searchParams.set('$orderby',options.offset!==undefined?'ListingKey asc':filters.sort==='price-asc'?'ListPrice asc,ListingKey asc':filters.sort==='price-desc'?'ListPrice desc,ListingKey desc':'ModificationTimestamp desc,ListingKey desc');if(options.offset!==undefined)url.searchParams.set('$skip',String(Math.max(0,Math.floor(options.offset))));
 // Media belongs in $expand, not $select (Spark rejects Media in $select).
 if(!options.lean)url.searchParams.set('$expand','Media');
 const checkedAt=new Date().toISOString(),rows:Listing[]=[],seen=new Set<string>(),visited=new Set<string>();let next:string|null=url.href,rawCount=0,pages=0,truncated=false;
 const signal=AbortSignal.timeout(25000);
 while(next&&rawCount<limit&&pages<30){
  const nextUrl:URL=new URL(next,base);if(nextUrl.origin!==base.origin||!nextUrl.pathname.startsWith(base.pathname.replace(/\/$/,'')+'/Property'))throw new Error('Invalid Spark pagination link.');
  if(visited.has(nextUrl.href))throw new Error('Repeated Spark pagination link.');visited.add(nextUrl.href);pages++;
  const response:Response=await fetcher(nextUrl.href,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal,cache:'no-store'});
  if(!response.ok)throw new Error(`Spark request failed (${response.status}).`);
  const data:{value:Record<string,unknown>[];"@odata.nextLink"?:string}=await response.json();if(!Array.isArray(data.value))throw new Error('Invalid Spark response.');
  for(const raw of data.value){if(rawCount>=limit){truncated=true;break;}rawCount++;const listing=mapSpark(raw,checkedAt);if(listing&&!options.listingId)listing.photos=listing.photos.slice(0,1);if(listing&&!seen.has(listing.id)){seen.add(listing.id);rows.push(listing);}}
  next=typeof data['@odata.nextLink']==='string'?data['@odata.nextLink']:null;
 }
 const result={listings:rows,checkedAt,hasMore:!!next||truncated};
 if(fetcher===fetch){if(cache.size>=60)cache.delete(cache.keys().next().value!);cache.set(key,{until:Date.now()+60000,result});}
 return result;
}

export async function sparkCount(fetcher:typeof fetch=fetch):Promise<number>{
 const token=sparkToken();if(!token)return 0;
 const base=new URL(process.env.SPARK_API_BASE||DEFAULT_BASE);if(base.protocol!=='https:'||!(base.hostname==='sparkapi.com'||base.hostname.endsWith('.sparkapi.com')))throw new Error('Invalid Spark endpoint.');
 const url=new URL(base.href.replace(/\/$/,'')+'/Property');url.searchParams.set('$filter',sparkFilter());url.searchParams.set('$top','1');url.searchParams.set('$count','true');url.searchParams.set('$select','ListingKey');
 const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});if(!response.ok)throw new Error('MLS sitemap count unavailable.');
 const data=await response.json(),count=data['@odata.count'];if(!Number.isSafeInteger(count)||count<0||count>500000)throw new Error('Invalid MLS sitemap count.');return count;
}
