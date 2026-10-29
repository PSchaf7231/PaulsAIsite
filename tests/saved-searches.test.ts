import { it,expect,afterEach,vi } from 'vitest';
import { newState,propose,confirmAction } from '../src/server/pax/state';
import { reviseCriteria,matchCriteria,saveConfirmedSearch } from '../src/server/pax/search-criteria';
import { queueListingAlerts } from '../src/server/pax/listing-alerts';
import { sampleListings } from '../src/server/listings/sample';
import { deliverNotification } from '../src/server/pax/notifications';
import { captureLead } from '../src/server/pax/conversion';
import { smsLink } from '../src/lib/sms';
import { verifyAdminToken,loginAdmin } from '../src/server/admin/auth';
import { suggestedTexts } from '../src/server/pax/text-suggestions';
import { createPaxAgent } from '../src/server/pax/agent';
import { MockLanguageModelV4 } from 'ai/test';
afterEach(()=>vi.unstubAllEnvs());
function lead(){const s=newState('a'.repeat(64));captureLead(s,{name:'Sam',phone:'2025550123',email:'sam@example.com',wanted:'Delray',timeline:'60 days',smsConsent:true,emailConsent:true,purpose:'CALL'});return s;}
it('keeps full criteria as a draft until confirmed and preserves fields on partial changes',()=>{
 const s=lead();reviseCriteria(s,{areas:['Delray Beach','Boynton Beach'],maxPrice:650000,beds:3,baths:2,mustHaves:['pool','no HOA'],dealBreakers:['waterfront'],movingReason:'Closer to work',notes:'Shorter commute'});
 expect(s.searches).toHaveLength(0);let a=propose(s,{kind:'SEARCH',contact:s.lead!});if('error' in a)throw Error(a.error);confirmAction(s,a.id,true);
 expect(s.searches[0].preferences.baths).toBe(2);reviseCriteria(s,{},['Lake Worth Beach']);reviseCriteria(s,{maxPrice:700000});
 expect(s.preferences.areas).toEqual(['Delray Beach','Boynton Beach','Lake Worth Beach']);expect(s.preferences.mustHaves).toEqual(['pool','no HOA']);expect(s.searches[0].preferences.maxPrice).toBe(650000);
 a=propose(s,{kind:'SEARCH',contact:s.lead!});if('error' in a)throw Error(a.error);confirmAction(s,a.id,true);expect(s.searches).toHaveLength(1);expect(s.searches[0].preferences.maxPrice).toBe(700000);expect(s.searches[0].preferences.movingReason).toBe('Closer to work');
});
it('ranks samples honestly, respects hard constraints, and does not invent HOA or 55+ facts',()=>{
 const pool=matchCriteria({areas:['Delray','Boynton'],maxPrice:650000,beds:3,baths:2,mustHaves:['pool','no HOA'],type:'SALE'});
 expect(pool[0].listing.slug).toBe('boynton-poolside');expect(pool[0].exact).toBe(false);expect(pool[0].unknown).toContain('no HOA not verified');
 expect(matchCriteria({maxPrice:1000,type:'SALE'})).toHaveLength(0);expect(matchCriteria({mustHaves:['55+']} ).every(m=>!m.exact)).toBe(true);
 expect(matchCriteria({dealBreakers:['pool']}).some(m=>m.listing.slug==='boynton-poolside')).toBe(false);
});
it('baselines existing inventory, alerts only new exact matches once, and uses the confirmed rather than draft budget',()=>{
 vi.stubEnv('PAX_SMS_MODE','manual');const s=lead();saveConfirmedSearch(s,{areas:['Delray Beach'],maxPrice:600000,type:'SALE'},'search-1');
 expect(queueListingAlerts(s)).toBe(0);s.preferences.maxPrice=300000;
 const added={...sampleListings[0],id:'test-new',slug:'test-new'};expect(queueListingAlerts(s,[...sampleListings,added])).toBe(1);
 expect(s.notifications.filter(n=>n.reason==='new sample matches')).toHaveLength(1);expect(s.notifications.at(-1)?.channel).toBe('email');expect(queueListingAlerts(s,[...sampleListings,added])).toBe(0);
 saveConfirmedSearch(s,{mustHaves:['no HOA']},'search-2');expect(queueListingAlerts(s,[...sampleListings,added])).toBe(0);
});
it('manual mode queues email only and blocks legacy SMS even if notification mode is both',async()=>{
 vi.stubEnv('PAX_SMS_MODE','manual');vi.stubEnv('PAX_NOTIFICATIONS','both');const s=lead();expect(s.notifications.every(n=>n.channel==='email')).toBe(true);
 const fetcher=vi.fn();expect(await deliverNotification({...s.notifications[0],channel:'sms'},fetcher)).toMatchObject({status:'manual'});expect(fetcher).not.toHaveBeenCalled();
 expect(suggestedTexts(s)).toHaveLength(3);expect(suggestedTexts(s)[0]).toContain('Paul Schafranick');
});
it('encodes SMS drafts for Android and iOS without turning message text into URI parameters',()=>{
 const text='Hi Sam & family? Pool + garage\nPaul';for(const ios of [false,true]){const link=smsLink('+12025550123',text,ios)!;expect(link.startsWith(`sms:+12025550123${ios?'&':'?'}body=`)).toBe(true);expect(decodeURIComponent(link.split('body=')[1])).toBe(text);}expect(smsLink('javascript:bad','Hi')).toBeNull();
});
it('checks the Supabase user server-side and restricts access to the confirmed administrator email',async()=>{
 vi.stubEnv('PAX_TEST_MODE','');vi.stubEnv('SUPABASE_URL','https://example.supabase.co');vi.stubEnv('SUPABASE_ANON_KEY','test-public-key');vi.stubEnv('PAX_ADMIN_EMAIL','paul@example.com');
 expect(await verifyAdminToken(undefined)).toBe(false);
 expect(await verifyAdminToken('token',vi.fn().mockResolvedValue(Response.json({id:'u',email:'other@example.com',email_confirmed_at:'now'})))).toBe(false);
 expect(await verifyAdminToken('token',vi.fn().mockResolvedValue(Response.json({id:'u',email:'paul@example.com',email_confirmed_at:'now'})))).toBe(true);
 expect(await loginAdmin('other@example.com','password',vi.fn())).toBeNull();
 vi.stubEnv('NODE_ENV','production');vi.stubEnv('PAX_TEST_MODE','1');vi.stubEnv('PAX_STORAGE','local');vi.stubEnv('PAX_ADMIN_TEST_PASSWORD','test');expect(await verifyAdminToken('test-test',vi.fn().mockResolvedValue(new Response('',{status:401})))).toBe(false);
});
it('executes conversational extraction through the real AI SDK tools',async()=>{
 const s=newState('b'.repeat(64)),quote='3 beds in Delray or Boynton under 650000, pool, 60 days, closer to work';s.messages.push({id:'m',role:'user',text:quote,at:new Date().toISOString()});
 const usage={inputTokens:{total:10,noCache:10,cacheRead:undefined,cacheWrite:undefined},outputTokens:{total:5,text:5,reasoning:undefined}};
 const model=new MockLanguageModelV4({doGenerate:[{content:[{type:'tool-call',toolCallId:'c',toolName:'update_search_criteria',input:JSON.stringify({patch:{areas:['Delray Beach','Boynton Beach'],maxPrice:650000,beds:3,mustHaves:['pool'],timeline:'60 days',movingReason:'closer to work'},addAreas:[],removeAreas:[],clearFields:[],evidence:quote})}],finishReason:{unified:'tool-calls',raw:undefined},usage,warnings:[]},{content:[{type:'text',text:'So, 3 beds in Delray or Boynton under $650k with a pool. Is that right?'}],finishReason:{unified:'stop',raw:undefined},usage,warnings:[]}]});
 const result=await createPaxAgent(s,model).generate({prompt:quote});expect(result.text).toContain('Is that right');expect(s.preferences.movingReason).toBe('closer to work');expect(s.searches).toHaveLength(0);expect(s.results[0]).toBe('boynton-poolside');
});

it('stops a saved search and cancels queued alerts only with the correct token',async()=>{
 const {pauseSearchAlerts}=await import('../src/server/pax/unsubscribe');const s=lead();saveConfirmedSearch(s,{areas:['Delray Beach'],type:'SALE'},'id');
 queueListingAlerts(s,[...sampleListings,{...sampleListings[0],id:'extra',slug:'extra'}]);expect(pauseSearchAlerts(s,'f'.repeat(64))).toBe(false);expect(pauseSearchAlerts(s,s.searches[0].unsubscribeToken!)).toBe(true);expect(s.searches[0].status).toBe('PAUSED_SAMPLE');expect(s.notifications.filter(n=>n.reason==='new sample matches').every(n=>n.status==='cancelled')).toBe(true);
});
