import {it,expect,vi,afterEach} from 'vitest';
import {captureSchema,captureLead} from '../src/server/pax/conversion';
import {newState} from '../src/server/pax/state';
import {sellerSignal,recordSeller} from '../src/server/pax/seller';
import {suggestedTexts} from '../src/server/pax/text-suggestions';
afterEach(()=>vi.unstubAllEnvs());
it('accepts email-only capture and leaves optional personal details absent',()=>{vi.stubEnv('PAX_SMS_MODE','manual');const input=captureSchema.parse({email:'buyer@example.com'}),s=newState('a');captureLead(s,input);expect(s.lead?.email).toBe('buyer@example.com');expect(s.lead?.name).toBeUndefined();expect(s.lead?.phone).toBeUndefined();expect(s.notifications.every(n=>n.channel==='email')).toBe(true);});
it('records seller facts from their own words and marks the alert SELLER',()=>{vi.stubEnv('PAX_SMS_MODE','manual');expect(sellerSignal("I'm selling")).toBe(true);expect(sellerSignal("I don't want to sell my home")).toBe(false);const s=newState('a');const quote='Selling 123 Palm Way in 60 days because we are downsizing and also buying.';s.messages.push({id:'1',role:'user',text:quote,at:'2026-10-30T00:00:00Z'});recordSeller(s,{address:'123 Palm Way',timeline:'60 days',reason:'downsizing',alsoBuying:true},quote);expect(s.preferences.intent).toBe('SELLER');expect(s.seller?.alsoBuying).toBe(true);expect(s.notifications[0].summary).toMatch(/^SELLER/);expect(suggestedTexts(s)[0]).toContain(quote);expect(recordSeller(s,{address:'Invented'},'not their words')).toHaveProperty('error');});
