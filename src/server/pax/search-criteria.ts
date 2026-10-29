import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import type { Listing } from '../../lib/listings';
import type { PaxState,Preference } from '../../lib/pax';
import { sampleListings } from '../listings/sample';
import { searchSummary } from '../../lib/search-summary';
const terms=z.array(z.string().trim().min(1).max(100)).max(12);
export const criteriaSchema=z.object({area:z.string().max(80).optional(),areas:z.array(z.string().min(1).max(80)).max(10).optional(),minPrice:z.number().min(0).max(100000000).optional(),maxPrice:z.number().min(0).max(100000000).optional(),beds:z.number().int().min(0).max(30).optional(),baths:z.number().min(0).max(30).optional(),type:z.enum(['SALE','RENT','COMMERCIAL']).optional(),propertyType:z.enum(['HOUSE','CONDO','TOWNHOUSE','VILLA','MULTIFAMILY','LAND','OTHER']).optional(),mustHaves:terms.optional(),dealBreakers:terms.optional(),timeline:z.string().max(160).optional(),movingReason:z.string().max(400).optional(),notes:z.string().max(800).optional(),intent:z.enum(['BUYER','SELLER','RENTER','BROWSING']).optional(),preApproved:z.boolean().optional()});
const city=(s:string)=>({delray:'delray beach',boynton:'boynton beach',boca:'boca raton','lake worth':'lake worth beach'}[s.toLowerCase().trim()]||s.toLowerCase().trim());
function fact(l:Listing,term:string):boolean|undefined{
 const f=l.features.join(' ').toLowerCase(),t=term.toLowerCase().trim();
 if(typeof l.verifiedAmenities?.[t]==='boolean')return l.verifiedAmenities[t];
 if(t==='no hoa'||t==='hoa-free')return /no hoa|no homeowners association/.test(f)?true:/hoa required/.test(f)?false:undefined;
 if(t==='hoa')return /no hoa/.test(f)?false:/hoa required/.test(f)?true:undefined;
 if(t==='55+'||t==='55 plus')return /55\+|age-restricted/.test(f)?true:undefined;
 if(t==='private pool')return /private pool/.test(f)?true:undefined;
 const keyword=/garage/.test(t)?'garage':/pool/.test(t)?'pool':/waterfront/.test(t)?'waterfront':t;
 return f.includes(keyword)?true:undefined;
}
export function matchCriteria(criteria:Preference,listings:Listing[]=sampleListings){
 const areas=criteria.areas?.length?criteria.areas:criteria.area?[criteria.area]:[];
 return listings.filter(l=>l.status==='ACTIVE'&&(!areas.length||areas.some(a=>city(a)===city(l.city)))&&(!criteria.type||l.type===criteria.type)&&(criteria.minPrice==null||l.price>=criteria.minPrice)&&(criteria.maxPrice==null||l.price<=criteria.maxPrice)&&(criteria.beds==null||l.beds>=criteria.beds)&&(criteria.baths==null||l.baths>=criteria.baths)).map(listing=>{
  const unknown:string[]=[];let excluded=false,verified=0;
  if(criteria.propertyType){if(!listing.propertyType)unknown.push(`${criteria.propertyType.toLowerCase()} property type not verified`);else if(listing.propertyType!==criteria.propertyType)excluded=true;}
  for(const term of criteria.mustHaves||[]){const value=fact(listing,term);if(value===false)excluded=true;else if(value===undefined)unknown.push(`${term} not verified`);else verified++;}
  for(const term of criteria.dealBreakers||[]){const value=fact(listing,term);if(value===true)excluded=true;else if(value===undefined)unknown.push(`absence of ${term} not verified`);else verified++;}
  return {listing,unknown,excluded,verified,exact:unknown.length===0&&!excluded};
 }).filter(m=>!m.excluded).sort((a,b)=>Number(b.exact)-Number(a.exact)||a.unknown.length-b.unknown.length||b.verified-a.verified||a.listing.price-b.listing.price);
}
export function showMatches(state:PaxState,listings:Listing[]=sampleListings){
 const all=matchCriteria(state.preferences,listings);state.hasMoreResults=all.length>6;const matches=all.slice(0,6);state.results=matches.map(m=>m.listing.slug);state.matchNotes=Object.fromEntries(matches.map(m=>[m.listing.slug,m.unknown]));
 state.events.push({kind:'search',at:new Date().toISOString(),detail:JSON.stringify(state.preferences)});
 return {sampleOnly:true,criteria:searchSummary(state.preferences),matches:matches.map((m,i)=>({number:i+1,listing:m.listing,exact:m.exact,needsConfirmation:m.unknown})),message:matches.length?'Show these exact sample records. Label any unverified requirements. Never claim potential matches meet all requirements.':'No samples meet the numeric/location criteria. Do not invent homes or silently relax criteria; ask about changing one requirement.'};
}
export function reviseCriteria(state:PaxState,patch:Partial<Preference>,addAreas:string[]=[],removeAreas:string[]=[],clearFields:string[]=[]){
 const next={...state.preferences,...Object.fromEntries(Object.entries(patch).filter(([,v])=>v!==undefined))};
 if(patch.area&&!patch.areas)next.areas=[patch.area];
 const areas=next.areas|| (next.area?[next.area]:[]);
 if(addAreas.length||removeAreas.length)next.areas=[...new Map([...areas,...addAreas].filter(a=>!removeAreas.some(r=>city(r)===city(a))).map(a=>[city(a),a])).values()];
 if(next.areas)delete next.area;
 for(const field of clearFields)delete (next as Record<string,unknown>)[field];
 state.preferences=next;
 // Earlier cards must not save stale criteria after a correction.
 for(const a of state.actions)if(a.kind==='SEARCH'&&a.status==='pending')a.status='declined';
 state.events.push({kind:'criteria_drafted',at:new Date().toISOString(),detail:JSON.stringify(next)});
 return showMatches(state);
}
export function saveConfirmedSearch(state:PaxState,preferences:Preference,id:string){
 const existing=state.searches[0];state.searches=[{id:existing?.id||id,preferences:structuredClone(preferences),status:'ACTIVE_SAMPLE',unsubscribeToken:existing?.unsubscribeToken||randomBytes(32).toString('hex'),createdAt:existing?.createdAt||new Date().toISOString(),seenListingIds:sampleListings.map(l=>l.id)}];
}
