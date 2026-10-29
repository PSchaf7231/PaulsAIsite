import { describe,beforeEach,it,expect,vi,afterEach } from 'vitest';
import { createHmac,randomUUID } from 'node:crypto';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { captureLead,trackActivity,activitySummary,captureSchema } from '../src/server/pax/conversion';
import { newState,sampleListings } from '../src/server/pax/state';
import { dispatchQueued,deliverNotification } from '../src/server/pax/notifications';
import { facebookChanges,validSignature,receiveFacebook,processFacebook } from '../src/server/pax/facebook';
import { readSession } from '../src/server/pax/store';
beforeEach(()=>vi.stubEnv("PAX_SMS_MODE","twilio"));
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const input={name:'Test Visitor',email:'visitor@example.com',phone:'2025550123',wanted:'Delray under $600k',timeline:'60 days',smsConsent:true,emailConsent:true,purpose:'SEARCH' as const};
describe('interest and conversion',()=>{
 it('rejects empty or malformed contact before attempting storage',()=>{expect(captureSchema.safeParse({...input,email:'',phone:''}).success).toBe(false);expect(captureSchema.safeParse({...input,email:'',phone:'abc'}).success).toBe(false);expect(captureSchema.safeParse({...input,phone:''}).success).toBe(true);});
 it('offers after three unique views, a favorite, or a return visit, and respects dismissal',()=>{
  const s=newState('a'.repeat(64));trackActivity(s,{kind:'visit',visitId:randomUUID()});
  trackActivity(s,{kind:'view',slug:'delray-courtyard'});expect(activitySummary(s).eligible).toBe(false);
  trackActivity(s,{kind:'favorite',slug:'delray-courtyard'});expect(activitySummary(s).eligible).toBe(true);
  trackActivity(s,{kind:'dismiss'});expect(activitySummary(s).eligible).toBe(false);
  trackActivity(s,{kind:'time',seconds:30});expect(s.activity?.seconds).toBe(30);expect(s.lead).toBeUndefined();trackActivity(s,{kind:'search',filters:{area:'Delray Beach',minPrice:100000,sort:'price-desc'}});trackActivity(s,{kind:'search',filters:{}});expect(s.preferences.area).toBeUndefined();expect(s.preferences.minPrice).toBeUndefined();
  const views=newState('c'.repeat(64));trackActivity(views,{kind:'visit',visitId:randomUUID()});for(const home of sampleListings.slice(0,3))trackActivity(views,{kind:'view',slug:home.slug});expect(activitySummary(views).eligible).toBe(true);
  const r=newState('b'.repeat(64));trackActivity(r,{kind:'visit',visitId:randomUUID()});trackActivity(r,{kind:'visit',visitId:randomUUID()});expect(activitySummary(r).eligible).toBe(true);
 });
 it('attaches browsing and preferences to one lead and queues four separate deliveries exactly once',()=>{
  const s=newState('a'.repeat(64));trackActivity(s,{kind:'favorite',slug:'delray-courtyard'});trackActivity(s,{kind:'search',filters:{area:'Delray Beach',maxPrice:600000}});
  captureLead(s,input);const id=s.lead?.id;captureLead(s,input);
  expect(s.lead?.id).toBe(id);expect(s.source).toBe('WEBSITE');expect(s.saved).toEqual(['delray-courtyard']);expect(s.preferences).toMatchObject({area:'Delray Beach',timeline:'60 days'});
  expect(s.notifications).toHaveLength(4);expect(s.notifications.filter(n=>n.audience==='lead').map(n=>n.channel).sort()).toEqual(['email','sms']);expect(activitySummary(s).eligible).toBe(false);
 });
 it('never interprets contact information as permission to automate messages',()=>{
  const s=newState('a'.repeat(64));captureLead(s,{...input,smsConsent:false,emailConsent:false});expect(s.notifications).toHaveLength(2);expect(s.notifications.every(n=>n.audience==='agent')).toBe(true);
 });
 it('delivers both channels independently and retries only the failed channel',async()=>{
  for(const [k,v] of Object.entries({PAX_NOTIFICATIONS:'both',RESEND_API_KEY:'test',RESEND_FROM:'pax@example.com',PAX_AGENT_EMAIL:'paul@example.com',PAX_AGENT_PHONE:'+15612557285',TWILIO_ACCOUNT_SID:'test',TWILIO_AUTH_TOKEN:'test',TWILIO_FROM_NUMBER:'+12025550199'}))vi.stubEnv(k,v);
  const s=newState('a'.repeat(64));captureLead(s,input);
  const fetcher=vi.fn(async(url:unknown)=>String(url).includes('twilio')?new Response('outage',{status:503}):Response.json({id:'email-accepted'}));vi.stubGlobal('fetch',fetcher);
  await dispatchQueued(s);expect(s.notifications.filter(n=>n.status==='sent')).toHaveLength(2);expect(s.notifications.filter(n=>n.status==='retry')).toHaveLength(2);
  const bodies=fetcher.mock.calls.map(call=>call[0]);expect(bodies).toHaveLength(4);
  fetcher.mockClear();for(const n of s.notifications)n.nextAttemptAt=new Date(0).toISOString();await dispatchQueued(s);expect(fetcher).toHaveBeenCalledTimes(2);
  const email=s.notifications.find(n=>n.audience==='lead'&&n.channel==='email')!;const mock=vi.fn().mockResolvedValue(Response.json({id:'ok'}));await deliverNotification(email,mock);expect(JSON.parse(mock.mock.calls[0][1].body).to).toEqual(['visitor@example.com']);
 });
});
describe('Facebook intake',()=>{
 const body={object:'page',entry:[{id:'100',changes:[{field:'leadgen',value:{leadgen_id:'200',form_id:'300'}}]}]};
 function setup(){for(const [k,v] of Object.entries({FACEBOOK_APP_SECRET:'secret',FACEBOOK_PAGE_ID:'100',FACEBOOK_FORM_IDS:'300',FACEBOOK_PAGE_ACCESS_TOKEN:'test',FACEBOOK_GRAPH_VERSION:'v24.0',FACEBOOK_SMS_CONSENT_FIELD:'sms_ok',FACEBOOK_EMAIL_CONSENT_FIELD:'email_ok',PAX_STORAGE:'local',PAX_NOTIFICATIONS:'off'}))vi.stubEnv(k,v);}
 it('verifies raw signatures and filters unapproved forms and pages',()=>{
  setup();const raw=JSON.stringify(body),signature='sha256='+createHmac('sha256','secret').update(raw).digest('hex');expect(validSignature(raw,signature)).toBe(true);expect(validSignature(raw+' ',signature)).toBe(false);expect(validSignature(raw,null)).toBe(false);
  expect(facebookChanges(body)).toHaveLength(1);vi.stubEnv('FACEBOOK_FORM_IDS','999');expect(facebookChanges(body)).toHaveLength(0);
 });
 it('durably receives retries, fetches the form once, preserves source and explicit consent',async()=>{
  setup();const dir=await mkdtemp(path.join(tmpdir(),'facebook-test-'));vi.stubEnv('PAX_LOCAL_DIRECTORY',dir);
  try{const [id]=await receiveFacebook(body);await receiveFacebook(body);expect((await readSession(id))?.facebook?.status).toBe('pending');
   const fetcher=vi.fn().mockResolvedValue(Response.json({id:'200',form_id:'300',field_data:[{name:'full_name',values:['Test Lead']},{name:'email',values:['visitor@example.com']},{name:'phone_number',values:['2025550123']},{name:'sms_ok',values:['Yes']},{name:'email_ok',values:['No']},{name:'looking_for',values:['Delray']},{name:'timeline',values:['90 days']}]}));
   await processFacebook(id,fetcher);await processFacebook(id,fetcher);expect(fetcher).toHaveBeenCalledTimes(1);
   const s=(await readSession(id))!;expect(s.source).toBe('FACEBOOK_FORM');expect(s.lead?.name).toBe('Test Lead');expect(s.notifications).toHaveLength(3);expect(s.communicationConsent).toMatchObject({sms:true,email:false});expect(s.facebook?.status).toBe('processed');
  }finally{await rm(dir,{recursive:true,force:true});}
 });
 it('keeps failed retrieval pending without creating a partial lead',async()=>{
  setup();const dir=await mkdtemp(path.join(tmpdir(),'facebook-test-'));vi.stubEnv('PAX_LOCAL_DIRECTORY',dir);
  try{const [id]=await receiveFacebook(body);await processFacebook(id,vi.fn().mockResolvedValue(new Response('unavailable',{status:503})));const s=(await readSession(id))!;expect(s.lead).toBeUndefined();expect(s.facebook).toMatchObject({status:'pending',attempts:1});expect(s.notifications).toHaveLength(0);}finally{await rm(dir,{recursive:true,force:true});}
 });
});
