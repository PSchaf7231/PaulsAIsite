import {afterEach,describe,expect,it,vi} from 'vitest';
import {paxProviderConfig,paxConfigured,createPaxModel} from '../src/server/pax/provider';
import {buyerPaxTools} from '../src/server/pax/tools';
import {newState,now} from '../src/server/pax/state';

afterEach(()=>vi.unstubAllEnvs());
describe('Pax provider selection',()=>{
 it('defaults to Anthropic Haiku and does not fall back to an unrelated key',()=>{
  expect(paxProviderConfig({ANTHROPIC_API_KEY:'test-key'})).toMatchObject({provider:'anthropic',model:'claude-haiku-5-5'});
  expect(()=>paxProviderConfig({OPENAI_API_KEY:'do-not-use'})).toThrow('ANTHROPIC_API_KEY');
 });
 it.each([['anthropic','ANTHROPIC_API_KEY'],['google','GEMINI_API_KEY'],['xai','XAI_API_KEY']])('routes %s to its own SDK and key', (provider,key)=>{
  vi.stubEnv('AI_PROVIDER',provider);vi.stubEnv('AI_MODEL','test-model');vi.stubEnv(key,'unit-test-placeholder');
  expect(paxConfigured()).toBe(true);expect(createPaxModel().modelId).toBe('test-model');
  expect(createPaxModel().provider).toContain(provider==='google'?'google':provider);
  vi.stubEnv(key,'');expect(paxConfigured()).toBe(false);
 });
 it('rejects invalid providers and requires an explicit model for other providers',()=>{
  expect(()=>paxProviderConfig({AI_PROVIDER:'unknown',ANTHROPIC_API_KEY:'private-value'})).toThrow('AI_PROVIDER');
  expect(()=>paxProviderConfig({AI_PROVIDER:'google',GEMINI_API_KEY:'test'})).toThrow('AI_MODEL');
  expect(()=>paxProviderConfig({AI_PROVIDER:'xai',AI_MODEL:'test',ANTHROPIC_API_KEY:'private-value'})).toThrow('XAI_API_KEY');
 });
});
describe('Pax buyer boundaries',()=>{
 it('excludes seller-only tools and ties proposed contact to the discussed property',async()=>{
  vi.stubEnv('SPARK_ACCESS_TOKEN','');vi.stubEnv('SPARK_API_TOKEN','');
  const state=newState('a'.repeat(64));
  state.messages.push({id:'test-turn',role:'user',text:'Please contact me at buyer@example.com about this home',at:now()});
  const tools=buyerPaxTools(state);
  expect(tools).not.toHaveProperty('record_seller_details');expect(tools).not.toHaveProperty('request_home_value_report');
  const options={toolCallId:'test',messages:[],context:{}};
  const missing=await tools.capture_lead.execute!({email:'buyer@example.com'},options);
  expect(missing).toHaveProperty('error');expect(state.actions).toHaveLength(0);
  state.currentPage={listingSlug:'delray-courtyard'};
  await tools.capture_lead.execute!({email:'buyer@example.com'},options);
  expect(state.actions[0]).toMatchObject({kind:'CONTACT',listingSlug:'delray-courtyard',status:'pending'});
  expect(state.lead).toBeUndefined();
 });
});
