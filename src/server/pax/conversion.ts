import {metaPixelId} from '../../lib/marketing-config';
import { sparkConfigured } from '../listings/spark';
import { automaticSms } from './delivery-settings';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { PaxState, Contact } from '../../lib/pax';
import { event, home, normalizeContact, notify, now, updatePreferences } from './state';
export const captureSchema=z.object({eventId:z.string().uuid().optional(),analyticsConsent:z.boolean().optional(),intent:z.enum(['BUYER','SELLER','RENTER']).optional(),name:z.string().trim().max(100).optional(),email:z.union([z.string().email().max(254),z.literal('')]).optional(),phone:z.string().max(30).optional(),wanted:z.string().trim().max(600).optional(),timeline:z.string().trim().max(100).optional(),smsConsent:z.boolean().default(false),emailConsent:z.boolean().default(false),purpose:z.enum(['CONTACT','SEARCH','CALL','VALUATION']).default('CONTACT')}).strict().superRefine((data,ctx)=>{try{normalizeContact(data);}catch{ctx.addIssue({code:z.ZodIssueCode.custom,message:'Provide a valid phone number or email address.'});}});
export type CaptureInput=z.infer<typeof captureSchema>;
export function queueFollowup(state:PaxState){
 if(!state.lead)return;
 for(const channel of ['email','sms'] as const){
  if(channel==='sms'&&!automaticSms())continue;
  const to=channel==='email'?state.lead.email:state.lead.phone;
  if(!to||!state.communicationConsent?.[channel]||state.notifications.some(n=>n.audience==='lead'&&n.channel===channel))continue;
  const summary=`Hi${state.lead.name?` ${state.lead.name}`:''}, this is Madison, Paul Schafranick’s AI assistant. Thanks for reaching out about ${state.wanted||state.preferences.area||'Palm Beach County homes'}. Paul has your request and will follow up personally. You can reach Paul at 561-255-7285. ${(state.feedMode?state.feedMode!=='sample':sparkConfigured())?'Listing availability and appointment times need Paul’s confirmation.':'Our website currently displays fictional sample homes; no showing is confirmed.'}${channel==='sms'?' Reply STOP to opt out.':''}`;
  state.notifications.push({id:randomUUID(),reason:'instant follow-up',summary,status:'pending',attempts:0,nextAttemptAt:now(),channel,audience:'lead',to});
 }
}
export function captureLead(state:PaxState,input:CaptureInput,source:'WEBSITE'|'FACEBOOK_FORM'='WEBSITE'){
 if(input.eventId&&state.events.some(e=>e.kind==='lead_submission'&&e.detail===input.eventId))return {saved:true,eventId:input.eventId,message:'Your request is saved for Paul.'};
 const contact:Contact=normalizeContact(input);
 if(input.intent)state.preferences.intent=input.intent;
 state.source=source;if(input.wanted)state.wanted=input.wanted;
 if(input.timeline)updatePreferences(state,{timeline:input.timeline});
 state.communicationConsent={sms:input.smsConsent,email:input.emailConsent,at:now(),method:source==='WEBSITE'?'website unchecked channel choices':'Facebook form explicit yes fields'};
 const fresh=!state.lead;if(fresh)state.leadOrigin=source==='FACEBOOK_FORM'?'FACEBOOK_FORM':'WEBSITE';if(input.purpose==='VALUATION')state.preferences.intent='SELLER';
 if(fresh)state.lead={...contact,id:randomUUID(),capturedAt:now()};else Object.assign(state.lead!,contact);
 event(state,'contact_consent',JSON.stringify(state.communicationConsent));
 if(fresh){event(state,'lead_captured',source);notify(state,'lead captured');}
 if(input.purpose==='SEARCH'&&!state.searches.length)state.searches.push({id:randomUUID(),preferences:{...state.preferences},status:'SAMPLE_ONLY',createdAt:now()});
 event(state,'lead_request',input.purpose);queueFollowup(state);
 const eventId=input.eventId||randomUUID();
 if(!fresh&&input.eventId)notify(state,'lead request');
 if(source==='WEBSITE'&&(fresh||input.eventId))state.notifications.push({id:randomUUID(),integration:'fub',audience:'agent',payload:{person:{firstName:contact.name?.split(' ')[0],lastName:contact.name?.split(' ').slice(1).join(' '),emails:contact.email?[{value:contact.email}]:[],phones:contact.phone?[{value:contact.phone}]:[]},source:'PB Real Estate Pros website',type:'Registration',message:`${state.wanted||''}\nIntent: ${state.preferences.intent||'Exploring'}\nMLS properties viewed: ${state.viewed.map(slug=>{const l=state.listingRecords?.find(l=>l.slug===slug);return l?`${l.mlsNumber||slug}: ${l.address}`:slug;}).join(', ')||'none'}`},reason:'website lead',summary:'Follow Up Boss lead',status:'pending',attempts:0,nextAttemptAt:now()});
 if(input.analyticsConsent&&process.env.META_CONVERSIONS_ACCESS_TOKEN&&metaPixelId)state.notifications.push({id:randomUUID(),integration:'meta',payload:{eventId,eventTime:Math.floor(Date.now()/1000),email:contact.email,phone:contact.phone},reason:'lead conversion',summary:'Meta Lead conversion',status:'pending',attempts:0,nextAttemptAt:now()});
 if(input.eventId)event(state,'lead_submission',input.eventId);
 return {saved:true,eventId,message:'Your request is saved for Paul. Browsing stays open. Paul will confirm availability and any next steps.'};
}
export const activitySchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('visit'),visitId:z.string().uuid()}),
 z.object({kind:z.enum(['view','favorite']),slug:z.string().max(240)}),
 z.object({kind:z.literal('search'),filters:z.object({area:z.string().max(80).optional(),minPrice:z.number().nonnegative().max(100000000).optional(),sort:z.enum(["price-asc","price-desc"]).optional(),maxPrice:z.number().nonnegative().max(100000000).optional(),beds:z.number().int().min(0).max(20).optional(),type:z.enum(['SALE','RENT','COMMERCIAL']).optional()})}),
 z.object({kind:z.literal('time'),seconds:z.number().int().min(1).max(30)}),
 z.object({kind:z.enum(['dismiss','offer'])})
]);
export function trackActivity(state:PaxState,input:z.infer<typeof activitySchema>){
 state.activity??={visits:[],seconds:0,dismissedUntil:0,lastOfferAt:0};
 const a=state.activity;
 if(input.kind==='visit'&&!a.visits.includes(input.visitId)){a.visits.push(input.visitId);a.visits=a.visits.slice(-30);event(state,'visit');}
 if(input.kind==='view'||input.kind==='favorite'){const result=home(state,input.slug,input.kind==='favorite');if('error' in result)throw new Error('Unknown listing');}
 if(input.kind==='search'){state.preferences={...state.preferences,area:input.filters.area,minPrice:input.filters.minPrice,maxPrice:input.filters.maxPrice,beds:input.filters.beds,type:input.filters.type};updatePreferences(state,{});event(state,'browse_search',JSON.stringify(input.filters));}
 if(input.kind==='time')a.seconds+=input.seconds;
 if(input.kind==='dismiss'){a.dismissedUntil=Date.now()+24*60*60*1000;event(state,'soft_ask_declined');}
 if(input.kind==='offer')a.lastOfferAt=Date.now();
 return activitySummary(state);
}
export function activitySummary(state:PaxState){
 const a=state.activity;return {saved:state.saved,seconds:a?.seconds||0,eligible:!state.lead&&!!a&&Date.now()>a.dismissedUntil&&Date.now()-a.lastOfferAt>30*60*1000&&(state.viewed.length>=3||state.saved.length>0||a.visits.length>=2)};
}
