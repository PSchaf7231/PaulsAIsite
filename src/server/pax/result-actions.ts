import { sessionListings,rememberListings } from '../../lib/pax-inventory';
import type { PaxState,Preference } from '../../lib/pax';
import type { Listing } from '../../lib/listings';
import { sampleListings } from '../listings/sample';
import { reviseCriteria,matchCriteria } from './search-criteria';
export const removableFields=['areas','area','maxPrice','beds','baths','type','propertyType','mustHaves','dealBreakers'] as const;
export function removeCriterion(state:PaxState,field:typeof removableFields[number],value?:string){
 if(field==='maxPrice')return reviseCriteria(state,{},[],[],['minPrice','maxPrice']);
 if(field==='areas'||field==='mustHaves'||field==='dealBreakers'){
  const values=state.preferences[field]||[];
  return reviseCriteria(state,{[field]:values.filter(v=>v!==value)} as Partial<Preference>);
 }
 return reviseCriteria(state,{},[],[],[field]);
}
export function moreResults(state:PaxState,listings:Listing[]=sessionListings(state)){
 rememberListings(state,listings);const matches=matchCriteria(state.preferences,listings),seen=new Set(state.results),next=matches.filter(m=>!seen.has(m.listing.slug)).slice(0,6);
 state.results.push(...next.map(m=>m.listing.slug));state.matchNotes={...state.matchNotes,...Object.fromEntries(next.map(m=>[m.listing.slug,m.unknown]))};state.hasMoreResults=matches.some(m=>!state.results.includes(m.listing.slug));
 return {added:next.length,hasMore:state.hasMoreResults,listings:next.map((m,i)=>({number:state.results.length-next.length+i+1,listing:m.listing,needsConfirmation:m.unknown})),message:next.length?'These are the next actual matching records.':'You have seen all currently loaded matches. Never invent extra homes.'};
}
export function resultDetails(state:PaxState,number:number){
 const slug=state.results[number-1],listing=sessionListings(state).find(l=>l.slug===slug);
 return listing?{number,listing,sampleOnly:!!listing.isSample}:{error:'That number is not in the currently displayed results. Ask which visible home they mean.'};
}
export function compareHome(state:PaxState,slug:string,remove=false){
 if(!sessionListings(state).some(l=>l.slug===slug))return {error:'Unknown listing.'};
 state.compared??=[];
 if(remove)state.compared=state.compared.filter(s=>s!==slug);
 else if(!state.compared.includes(slug)){if(state.compared.length>=3)return {error:'Compare up to three homes. Remove one to add another.'};state.compared.push(slug);}
 return {compared:state.compared};
}
