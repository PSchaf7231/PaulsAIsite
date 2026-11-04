import {z} from 'zod';
import {createMadisonSession} from '@/server/pax/avatar';
import {readBody,identity,routeError,RequestError} from '@/server/pax/security';
import {PaxBusyError,withSession} from '@/server/pax/store';
import {event} from '@/server/pax/state';
export const runtime='nodejs';
export async function POST(req:Request){try{
 const parsed=z.object({consent:z.literal(true)}).strict().safeParse(await readBody(req));
 if(!parsed.success)throw new RequestError('Please accept the voice-chat privacy notice first.');
 if(!process.env.ANAM_API_KEY)throw new RequestError('Madison is temporarily unavailable. You can still browse homes or contact Paul.',503);
 if(!process.env.DIRECT_URL&&!process.env.DATABASE_URL&&!(process.env.NODE_ENV!=='production'&&process.env.PAX_STORAGE==='local'))throw new RequestError('Madison’s conversation service is not connected yet. You can still browse homes or contact Paul.',503);
 const id=(await identity(true))!;
 let conversationStorage:'connected'|'unavailable'='connected';
 try{
  await withSession(id,async(state,checkpoint)=>{
   const recent=state.events.filter(e=>e.kind==='avatar_session_requested'&&Date.parse(e.at)>Date.now()-3600000);
   if(recent.length>=6||recent.some(e=>Date.parse(e.at)>Date.now()-30000))throw new RequestError('Please wait a moment before starting another video session.',429);
   event(state,'avatar_session_requested','Madison voice privacy accepted');await checkpoint();
  });
 }catch(error){
  // Preserve intentional rate/concurrency limits. A database outage, however,
  // must not take down the independent Anam voice conversation.
  if(error instanceof RequestError||error instanceof PaxBusyError)throw error;
  conversationStorage='unavailable';
  console.error('[pax/avatar] conversation storage unavailable',error instanceof Error?error.name:'unknown');
 }
 const sessionToken=await createMadisonSession();
 return Response.json({sessionToken,conversationStorage},{headers:{'Cache-Control':'no-store'}});
}catch(error){return routeError(error);}}
