import type { PaxState } from '../../lib/pax';
import { event,notify,updatePreferences } from './state';
export function sellerSignal(text:string){
 return !/\b(not|don't|don’t|never|aren't|isn't)\b/i.test(text)&&(/\b(?:i['’]m|i am|we['’]re|we are) selling\b/i.test(text)||/\b(?:i|we) (?:want|need|have|plan) to sell\b/i.test(text)||/\b(?:sell|selling) (?:my|our) (?:home|house|condo|property)\b/i.test(text));
}
export function markSeller(state:PaxState){
 if(state.preferences.intent!=='SELLER'){updatePreferences(state,{intent:'SELLER'});event(state,'seller_identified');}
 notify(state,'SELLER inquiry');
}
export function recordSeller(state:PaxState,patch:{address?:string;timeline?:string;reason?:string;alsoBuying?:boolean},evidence:string){
 const text=state.messages.filter(m=>m.role==='user').at(-1)?.text||'';
 if(!evidence.trim()||!text.includes(evidence))return {error:'Use only the visitor’s own current words for seller details.'};
 state.seller={...state.seller,...Object.fromEntries(Object.entries(patch).filter(([,v])=>v!==undefined))};
 updatePreferences(state,{intent:'SELLER',...(patch.timeline?{timeline:patch.timeline}:{})});event(state,'seller_details_recorded');markSeller(state);
 if(state.lead&&patch.address)notify(state,`SELLER pricing review ${patch.address}`);
 return {seller:state.seller,message:'Help first with a practical selling step, then offer Paul’s free local pricing review. Ask one short missing question at a time; email is enough for first contact. No valuation or appointment is promised.'};
}
