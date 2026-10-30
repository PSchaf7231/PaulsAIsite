import { randomUUID } from 'node:crypto';
import type { PaxState } from '../../lib/pax';
import { sessionListings } from '../../lib/pax-inventory';
export type PageActionKind='photos'|'overview'|'interior'|'outdoor'|'practical'|'location'|'next';
export function requestPageAction(state:PaxState,kind:PageActionKind,evidence:string){
 const turn=state.messages.filter(m=>m.role==='user').at(-1);const message=turn?.text||'';
 if(/\b(don’t|don't|do not|never)\b/i.test(message))return {error:'The visitor did not authorize page movement.'};
 if(!evidence.trim()||!message.includes(evidence)||!/(show|open|scroll|take|go|next|photo|picture|see)/i.test(evidence))return {error:'Only move the page in response to the visitor’s explicit current request.'};
 const slug=state.currentPage?.listingSlug;if(!slug||!sessionListings(state).some(l=>l.slug===slug))return {error:'No listing detail page is currently open.'};
 if(kind==='photos'&&!sessionListings(state).find(l=>l.slug===slug)?.photos.length)return {error:'No photos were supplied for this listing. Offer to have Paul request them.'};
 if(state.pageAction)return {error:'One page movement per reply; finish the current request first.'};
 let target:string|undefined;
 if(kind==='next'){const index=state.results.indexOf(slug);target=index>=0?state.results[index+1]:undefined;if(!target||!sessionListings(state).some(l=>l.slug===target))return {error:'No next home in the current result list. Offer to show search results; do not guess or wrap around.'};}
 state.pageAction={id:randomUUID(),turnId:turn!.id,kind,from:slug,target};return {status:'requested',action:state.pageAction,message:'The browser will apply this after the reply. Do not claim it has already happened.'};
}
