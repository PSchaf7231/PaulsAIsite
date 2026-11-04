import {z} from 'zod';
import {createMadisonSession} from '@/server/pax/avatar';
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
 catch(error){console.error('[pax/avatar] Anam session unavailable',error instanceof Error?error.message:'unknown');throw new RequestError('Madison could not connect to Anam. Please try again in a moment.',503);}
 return Response.json({sessionToken,conversationStorage:'not-required'},{headers:{'Cache-Control':'no-store'}});
}catch(error){return routeError(error);}}
