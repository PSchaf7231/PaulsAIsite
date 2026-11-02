export const MADISON_AVATAR_ID = '9d414187-9553-43b5-a83a-2c149e121703';
// Paul's Madison voice in Anam Lab: Lacey - Sunny Soul (Sonic 3.5). ANAM_VOICE_ID overrides.
export const DEFAULT_MADISON_VOICE_ID = '8cc7b2d8-4fc0-11f1-84b0-52bacf74fa75';
export async function createMadisonSession(fetcher:typeof fetch=fetch){
 const apiKey=process.env.ANAM_API_KEY;
 if(!apiKey)throw new Error('Avatar service is not configured.');
 const response=await fetcher('https://api.anam.ai/v1/auth/session-token',{
  method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
  body:JSON.stringify({personaConfig:{name:'Madison',avatarId:MADISON_AVATAR_ID,voiceId:process.env.ANAM_VOICE_ID||DEFAULT_MADISON_VOICE_ID,llmId:'CUSTOMER_CLIENT_V1',maxSessionLengthSeconds:300}}),
  cache:'no-store',signal:AbortSignal.timeout(15000),redirect:'error'
 });
 if(!response.ok)throw new Error('Avatar service could not start.');
 const data=await response.json();
 if(typeof data.sessionToken!=='string'||!data.sessionToken)throw new Error('Avatar service returned no session.');
 return data.sessionToken as string;
}
