import { randomUUID } from "node:crypto";
import type { Contact, PaxState, Preference, ActionKind, PendingAction } from "../../lib/pax";
import { sampleListings,searchSampleListings } from "../listings/sample";
export { sampleListings };
export function now(){return new Date().toISOString();}
export function newState(id:string):PaxState{return {id,createdAt:now(),updatedAt:now(),messages:[],preferences:{},results:[],viewed:[],saved:[],actions:[],events:[],searches:[],appointments:[],notifications:[],processedTurns:[],lastAskTurn:-10,declinedAtTurn:-10};}
export function event(state:PaxState,kind:string,detail?:string,listingSlug?:string){state.events.push({kind,at:now(),...(detail?{detail}:{}),...(listingSlug?{listingSlug}:{})});state.updatedAt=now();}
export function search(state:PaxState,filters:Preference){
 const results=searchSampleListings({city:filters.area,maxPrice:filters.maxPrice,beds:filters.beds,type:filters.type});
 state.results=results.map(l=>l.slug);event(state,"search",JSON.stringify(filters));
 return {sampleOnly:true,count:results.length,listings:results,message:results.length?"Fictional samples, not live or tourable inventory.":"No matching samples. Do not invent alternatives; offer to change one filter or ask Paul about real inventory."};
}
export function home(state:PaxState,slug:string,save=false){
 const listing=sampleListings.find(l=>l.slug===slug);if(!listing)return {error:"Unknown listing. Use search_listings."};
 const list=save?state.saved:state.viewed;if(!list.includes(slug))list.push(slug);
 event(state,save?"home_saved":"home_viewed",undefined,slug);
 return {listing,sampleOnly:true,saved:save};
}
export function updatePreferences(state:PaxState,preferences:Preference){
 state.preferences={...state.preferences,...Object.fromEntries(Object.entries(preferences).filter(([,value])=>value!==undefined))};event(state,"preferences_updated",JSON.stringify(preferences));
 return state.preferences;
}
export function normalizeContact(contact:Contact):Contact{
 const email=contact.email?.trim().toLowerCase();const raw=contact.phone?.replace(/\D/g,"");
 const phone=raw?(raw.length===10?`+1${raw}`:`+${raw}`):undefined;
 if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("Please use a valid email address.");
 if(phone && !/^\+[1-9]\d{7,14}$/.test(phone))throw new Error("Please include a valid phone number and country code.");
 if(!email&&!phone)throw new Error("A phone number or email is needed for this next step. Browsing is always open.");
 return {...(contact.name?{name:contact.name.trim()}:{}),...(email?{email}:{}),...(phone?{phone}:{})};
}
export function propose(state:PaxState,input:{kind:ActionKind;contact:Contact;preferredTime?:string;listingSlug?:string;address?:string}):PendingAction|{error:string}{
 const contact=normalizeContact(input.contact);
 const spoken=state.messages.filter(m=>m.role==="user").map(m=>m.text).join("\n");
 // A model may only propose contact information actually supplied in this conversation.
 if(contact.email&&!spoken.toLowerCase().includes(contact.email))return {error:"Do not invent contact information. Ask for their preferred email or phone first."};
 if(contact.phone&&!spoken.replace(/\D/g,"").includes(contact.phone.replace(/^\+1/,"").replace(/\D/g,"")))return {error:"Phone was not provided by the visitor."};
 if(input.kind==="SHOWING")return {error:"The five sample homes cannot be toured. Offer a call with Paul about comparable real homes instead."};
 if(input.kind==="CALL"&&!input.preferredTime)return {error:"Ask for one preferred day/time with timezone. This is a request, not a confirmed booking."};
 const turns=state.messages.filter(m=>m.role==="user").length;
 if(turns-state.declinedAtTurn<3)return {error:"They recently declined. Keep helping without another contact request yet."};
 const existing=state.actions.find(a=>a.status==="pending"&&a.kind===input.kind);
 if(existing)return existing;
 const action:PendingAction={...input,contact,id:randomUUID(),preferences:{...state.preferences},status:"pending",createdAt:now()};
 state.actions.push(action);state.lastAskTurn=turns;event(state,"action_proposed",input.kind);return action;
}
export function notify(state:PaxState,reason:string){
 if(state.notifications.some(n=>n.reason===reason))return;
 const p=state.preferences;
 const summary=[`Pax ${reason}.`,state.lead?.name||"Website visitor",state.lead?.phone||state.lead?.email||"No contact yet",p.intent||"Exploring",p.area||"Palm Beach County",p.maxPrice?`budget $${p.maxPrice}`:"",p.beds?`${p.beds}+ beds`:"",p.timeline?`timeline: ${p.timeline}`:"",p.preApproved?"Pre-approved":"",`${state.saved.length} saved / ${state.viewed.length} viewed`,state.appointments.at(-1)?.preferredTime||""].filter(Boolean).join(" · ").slice(0,900);
 state.notifications.push({id:randomUUID(),reason,summary,status:"pending",attempts:0,nextAttemptAt:now()});
 event(state,"agent_notification_queued",reason);
}
export function confirmAction(state:PaxState,id:string,accepted:boolean){
 const action=state.actions.find(a=>a.id===id);if(!action)throw new Error("That request is not available in this conversation.");
 if(action.status!=="pending")return {status:action.status};
 if(!accepted){action.status="declined";state.declinedAtTurn=state.messages.filter(m=>m.role==="user").length;event(state,"action_declined",action.kind);return {status:"declined",message:"No problem. You can keep browsing freely."};}
 action.status="confirmed";
 const hadLead=!!state.lead;
 if(!state.lead){state.lead={...action.contact,id:randomUUID(),capturedAt:now()};event(state,"lead_captured","WEBSITE");}
 else Object.assign(state.lead,action.contact);
 let message="Your contact information is saved for Paul to follow up about this request.";
 if(action.kind==="SEARCH"){
  state.searches.push({id:action.id,preferences:action.preferences,status:"SAMPLE_ONLY",createdAt:now()});event(state,"saved_search_created");
  message="Your search preferences are saved. This is sample data: automatic new-listing texts and emails are not running yet. Paul can follow up personally.";
 }
 if(action.kind==="CALL"){
  state.appointments.push({id:action.id,kind:"CALL",preferredTime:action.preferredTime!,status:"REQUESTED",createdAt:now()});event(state,"appointment_requested","CALL");
  message="Your call request is recorded. Paul still needs to confirm the time; it is not booked yet.";
 }
 if(action.kind==="VALUATION")message="Your request for a free home value report is recorded for Paul to review. Pax has not generated a valuation.";
 if(!hadLead)notify(state,"lead captured");else if(action.kind!=="CONTACT")notify(state,`${action.kind.toLowerCase()} requested ${action.id}`);
 event(state,"action_confirmed",action.kind);return {status:"confirmed",message};
}
export function flagHot(state:PaxState,reason:string){
 event(state,"hot_lead",reason);notify(state,`hot lead: ${reason}`);
 return {status:"queued",message:"Paul notification queued; delivery status is checked separately. Never claim delivered until confirmed."};
}
export function metrics(states:PaxState[]){
 const chats=states.filter(s=>s.messages.some(m=>m.role==="user"));
 const leads=chats.filter(s=>s.lead);const requested=leads.filter(s=>s.appointments.length);const booked=leads.filter(s=>s.appointments.some(a=>a.status==="CONFIRMED"));
 return {chats:chats.length,leads:leads.length,leadsWithAppointmentRequests:requested.length,leadsWithConfirmedAppointments:booked.length,chatsToLeads:chats.length?leads.length/chats.length:0,leadsToAppointments:leads.length?booked.length/leads.length:0,definition:"Session-based funnel; requests are separate from Paul-confirmed appointments. Multiple devices are not deduplicated people."};
}
