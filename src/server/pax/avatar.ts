export const MADISON_PERSONA_ID = 'cdb09e97-23af-4628-9d27-f8a270fb8265';
export async function createMadisonSession(fetcher:typeof fetch=fetch){
 const apiKey=process.env.ANAM_API_KEY;
 if(!apiKey)throw new Error('Avatar service is not configured.');
 const response=await fetcher('https://api.anam.ai/v1/auth/session-token',{
  method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
  body:JSON.stringify({personaConfig:{personaId:MADISON_PERSONA_ID}}),
  cache:'no-store',signal:AbortSignal.timeout(15000),redirect:'error'
 });
 if(!response.ok)throw new Error('Avatar service could not start.');
 const data=await response.json();
 if(typeof data.sessionToken!=='string'||!data.sessionToken)throw new Error('Avatar service returned no session.');
 return data.sessionToken as string;
}
