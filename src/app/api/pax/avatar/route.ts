import {z} from 'zod';
import {AnamSessionError,createMadisonSession} from '@/server/pax/avatar';
import {readBody,routeError,RequestError} from '@/server/pax/security';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const parsed=z.object({consent:z.literal(true)}).strict().safeParse(await readBody(req));
 if(!parsed.success)throw new RequestError('Please accept the voice-chat privacy notice first.');
 if(!process.env.ANAM_API_KEY)throw new RequestError('Madison is temporarily unavailable. You can still browse homes or contact Paul.',503);
 // Anam video chat is independent of Pax's saved text conversations. Do not
 // create a Pax cookie or touch the database before starting the voice call.
 // A storage outage must never stop Madison from speaking.
 let sessionToken:string;
 try{sessionToken=await createMadisonSession();}
 catch(error){
  const status=error instanceof AnamSessionError?error.status:0;
  console.error('[pax/avatar] Anam session unavailable',status||'unknown');
  if(status===401||status===403)throw new RequestError('Anam rejected the website API key. The Anam key in Vercel needs to be replaced.',503);
  if(status===404)throw new RequestError('Anam could not find Madison’s published persona. Please confirm the published persona ID.',503);
  if(status===400||status===409||status===422)throw new RequestError('Anam rejected Madison’s published persona setup. Please republish Madison in Anam.',503);
  if(status===429)throw new RequestError('The Anam account has reached its current session limit. Please try again later.',503);
  throw new RequestError('Anam is not completing the connection right now. Please try again later.',503);
 }
 return Response.json({sessionToken,conversationStorage:'not-required'},{headers:{'Cache-Control':'no-store'}});
}catch(error){return routeError(error);}}
