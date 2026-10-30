import { after } from 'next/server';
import { identity,readBody,routeError,RequestError } from '@/server/pax/security';
import { withSession } from '@/server/pax/store';
import { captureSchema,captureLead } from '@/server/pax/conversion';
import { flushNotifications } from '@/server/pax/notifications';
export async function POST(req:Request){try{
 const parsed=captureSchema.safeParse(await readBody(req));if(!parsed.success)throw new RequestError('Please enter a valid email address.');
 const id=(await identity(true))!;
 const result=await withSession(id,state=>{if(state.events.filter(e=>e.kind==='lead_request').length>=5)throw new RequestError('Your request is already saved. Please contact Paul for further changes.',429);return captureLead(state,parsed.data);});
 after(async()=>{try{await flushNotifications(id);}catch{/* Durable worker retries. */}});
 return Response.json(result.value,{headers:{'Cache-Control':'no-store'}});
}catch(e){return routeError(e);}}
