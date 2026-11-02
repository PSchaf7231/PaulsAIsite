import {afterEach,expect,it,vi} from 'vitest';
import {createMadisonSession,MADISON_AVATAR_ID} from '../src/server/pax/avatar';
afterEach(()=>vi.unstubAllEnvs());
it('exchanges the private key for a short-lived custom-LLM token using the requested avatar',async()=>{
 vi.stubEnv('ANAM_API_KEY','private-test-value');vi.stubEnv('ANAM_VOICE_ID','selected-voice');
 const fetcher=vi.fn().mockResolvedValue(Response.json({sessionToken:'ephemeral-token'}));
 expect(await createMadisonSession(fetcher)).toBe('ephemeral-token');
 const [url,options]=fetcher.mock.calls[0];expect(url).toBe('https://api.anam.ai/v1/auth/session-token');expect(options.headers.Authorization).toBe('Bearer private-test-value');
 expect(JSON.parse(options.body).personaConfig).toMatchObject({avatarId:MADISON_AVATAR_ID,voiceId:'selected-voice',llmId:'CUSTOMER_CLIENT_V1',maxSessionLengthSeconds:300});
 expect(JSON.parse(options.body).personaConfig).not.toHaveProperty('systemPrompt');expect(options.redirect).toBe('error');
});
it('does not request a session without the private key or expose upstream error bodies',async()=>{
 const fetcher=vi.fn();vi.stubEnv('ANAM_API_KEY','');await expect(createMadisonSession(fetcher)).rejects.toThrow('not configured');expect(fetcher).not.toHaveBeenCalled();
 vi.stubEnv('ANAM_API_KEY','private-test-value');fetcher.mockResolvedValue(new Response('sensitive provider details',{status:401}));await expect(createMadisonSession(fetcher)).rejects.toThrow('Avatar service could not start.');
 fetcher.mockResolvedValue(Response.json({}));await expect(createMadisonSession(fetcher)).rejects.toThrow('no session');
});
