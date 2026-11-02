export const MADISON_AVATAR_ID = 'cdb09e97-23af-4628-9df7-f8a270fb8265';
// Anam's documented default voice; can be changed without changing Pax's brain.
export const DEFAULT_MADISON_VOICE_ID = '6bfbe25a-979d-40f3-a92b-5394170af54b';
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
