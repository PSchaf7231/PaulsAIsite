import {afterEach,describe,it,expect,vi} from 'vitest';
vi.mock('../src/server/pax/store',()=>({withSession:vi.fn()}));
import {captureLead} from '../src/server/pax/conversion';
import {newState} from '../src/server/pax/state';
import {deliverNotification,dispatchQueued} from '../src/server/pax/notifications';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const input={name:'Jane Smith',email:'jane@example.com',phone:'5612557285',wanted:'Looking in Jupiter',intent:'BUYER' as const,smsConsent:false,emailConsent:false,purpose:'CONTACT' as const,eventId:'b980e17c-5631-444e-afd8-99ea6f679c15'};
describe('website marketing integrations',()=>{
 it('persists FUB delivery without credentials and deduplicates retried submissions',async()=>{
  vi.stubEnv('FUB_API_KEY','');const state=newState('a'.repeat(64));state.viewed=['jupiter-home'];captureLead(state,input);captureLead(state,input);
  expect(state.notifications.filter(n=>n.integration==='fub')).toHaveLength(1);
  const queued=state.notifications.find(n=>n.integration==='fub')!;
  expect(queued.payload).toMatchObject({source:'PB Real Estate Pros website',person:{firstName:'Jane',lastName:'Smith'}});
  expect(queued.payload?.message).toContain('jupiter-home');expect(await deliverNotification(queued)).toEqual({status:'unconfigured'});
 });
 it('delivers API leads with server authentication and retries provider failures',async()=>{
  vi.stubEnv('FUB_API_KEY','test-server-only');const state=newState('a'.repeat(64));captureLead(state,input);const queued=state.notifications.find(n=>n.integration==='fub')!;
  const fetcher=vi.fn().mockResolvedValueOnce(new Response('',{status:503})).mockResolvedValueOnce(Response.json({id:42}));vi.stubGlobal('fetch',fetcher);
  state.notifications=[queued];await dispatchQueued(state);expect(queued.status).toBe('retry');queued.nextAttemptAt=new Date(0).toISOString();await dispatchQueued(state);expect(queued.status).toBe('sent');expect(fetcher.mock.calls[1][0]).toBe('https://api.followupboss.com/v1/events');
 });
 it('CCs FUB only on agent emails',async()=>{
  for(const [key,value] of Object.entries({PAX_NOTIFICATIONS:'email',PAX_AGENT_EMAIL:'paul@example.com',RESEND_API_KEY:'test',RESEND_FROM:'site@example.com'}))vi.stubEnv(key,value);
  const state=newState('a'.repeat(64));captureLead(state,input);const fetcher=vi.fn().mockResolvedValue(Response.json({id:'sent'}));await deliverNotification(state.notifications.find(n=>n.channel==='email')!,fetcher);
  expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({to:['paul@example.com'],cc:['nextendeavorcre@followupboss.me']});
 });
 it('requires consent for CAPI, hashes identifiers, and shares the browser event ID',async()=>{
  vi.stubEnv('META_CONVERSIONS_ACCESS_TOKEN','test');vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID','123456');const state=newState('a'.repeat(64));captureLead(state,input);expect(state.notifications.some(n=>n.integration==='meta')).toBe(false);
  captureLead(state,{...input,eventId:'086c55d9-23fa-43f8-89df-9a95a241a37e',analyticsConsent:true});const notification=state.notifications.find(n=>n.integration==='meta')!;const fetcher=vi.fn().mockResolvedValue(Response.json({events_received:1}));await deliverNotification(notification,fetcher);
  const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.data[0].event_id).toBe('086c55d9-23fa-43f8-89df-9a95a241a37e');expect(body.data[0].user_data.em[0]).toMatch(/^[a-f0-9]{64}$/);expect(fetcher.mock.calls[0][1].body).not.toContain(input.email);
 });
});
