import { createHash,createHmac,timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { withSession,readSession } from './store';
import { captureLead } from './conversion';
import { now,event } from './state';
import { flushNotifications } from './notifications';
export function validSignature(raw:string,signature:string|null,secret=process.env.FACEBOOK_APP_SECRET){
 if(!secret||!signature||!/^sha256=[a-f0-9]{64}$/.test(signature))return false;
 return timingSafeEqual(Buffer.from(signature.slice(7),'hex'),createHmac('sha256',secret).update(raw).digest());
}
const numeric=z.string().regex(/^\d{1,40}$/);
const envelope=z.object({object:z.literal('page'),entry:z.array(z.object({id:numeric,changes:z.array(z.object({field:z.string(),value:z.unknown()})).max(100)})).max(100)});
const leadChange=z.object({leadgen_id:numeric,form_id:numeric,page_id:numeric.optional()});
export function facebookChanges(body:unknown){
 const data=envelope.parse(body),forms=(process.env.FACEBOOK_FORM_IDS||'').split(',').map(s=>s.trim());
 const records:{leadId:string;formId:string;pageId:string}[]=[];
 for(const entry of data.entry){if(entry.id!==process.env.FACEBOOK_PAGE_ID)continue;
  for(const change of entry.changes){if(change.field!=='leadgen')continue;const v=leadChange.parse(change.value);if(v.page_id&&v.page_id!==entry.id)throw new Error('Page mismatch');if(!forms.includes(v.form_id))continue;records.push({leadId:v.leadgen_id,formId:v.form_id,pageId:entry.id});}
 }return records;
}
export function facebookIdentity(leadId:string){return createHash('sha256').update(`facebook-lead:${leadId}`).digest('hex');}
export async function receiveFacebook(body:unknown){
 const ids:string[]=[];
 for(const record of facebookChanges(body)){
  const id=facebookIdentity(record.leadId);
  const existing=(await readSession(id))?.facebook;
  if(existing){if(existing.formId!==record.formId||existing.pageId!==record.pageId)throw new Error('Receipt identity mismatch');ids.push(id);continue;}
  await withSession(id,state=>{if(!state.facebook){state.source='FACEBOOK_FORM';state.facebook={...record,status:'pending',attempts:0,nextAttemptAt:now()};event(state,'facebook_received',record.formId);}});ids.push(id);
 }return ids;
}
const graphLead=z.object({id:numeric,form_id:numeric,created_time:z.string().optional(),ad_id:numeric.optional(),field_data:z.array(z.object({name:z.string(),values:z.array(z.string())}))});
export async function processFacebook(id:string,fetcher:typeof fetch=fetch){
 await withSession(id,async(state,checkpoint)=>{
  const job=state.facebook;if(!job||job.status!=='pending'||Date.parse(job.nextAttemptAt)>Date.now())return;
  const token=process.env.FACEBOOK_PAGE_ACCESS_TOKEN,secret=process.env.FACEBOOK_APP_SECRET,version=process.env.FACEBOOK_GRAPH_VERSION;
  if(!token||!secret||!version||!/^v\d+\.\d+$/.test(version))return;
  try{
   const url=new URL(`https://graph.facebook.com/${version}/${job.leadId}`);url.searchParams.set('fields','id,form_id,created_time,ad_id,field_data');url.searchParams.set('appsecret_proof',createHmac('sha256',secret).update(token).digest('hex'));
   const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Facebook retrieval failed');
   const lead=graphLead.parse(await response.json());if(lead.id!==job.leadId||lead.form_id!==job.formId)throw new Error('Lead mismatch');
   const fields=Object.fromEntries(lead.field_data.map(f=>[f.name,f.values[0]||'']));
   const consent=(name:string|undefined)=>!!name&&/^(yes|true|1)$/i.test(fields[name]?.trim()||'');
   captureLead(state,{name:(fields.full_name||[fields.first_name,fields.last_name].filter(Boolean).join(' ')||'Facebook visitor').slice(0,100),email:fields.email?.slice(0,254),phone:fields.phone_number?.slice(0,30),wanted:(fields[process.env.FACEBOOK_INTEREST_FIELD||'looking_for']||'Palm Beach County homes').slice(0,600),timeline:(fields[process.env.FACEBOOK_TIMELINE_FIELD||'timeline']||'Not provided').slice(0,100),emailConsent:consent(process.env.FACEBOOK_EMAIL_CONSENT_FIELD),smsConsent:consent(process.env.FACEBOOK_SMS_CONSENT_FIELD),purpose:'CALL'},'FACEBOOK_FORM');
   job.fieldData=fields;job.submittedAt=lead.created_time;job.adId=lead.ad_id;job.lastError=undefined;job.status='processed';event(state,'facebook_processed',job.leadId);
  }catch{job.lastError='Could not retrieve or validate this lead. Check Page token, lead access, form mapping and contact fields.';job.attempts++;job.status=job.attempts>=10?'failed':'pending';job.nextAttemptAt=new Date(Date.now()+Math.min(3600000,30000*2**job.attempts)).toISOString();}
  // Commit lead, consent and all deliveries together through withSession's transaction.
  void checkpoint;
 });
 await flushNotifications(id);
}
