import { z } from 'zod';
import { readBody,RequestError,routeError } from '@/server/pax/security';
import { readSession,withSession } from '@/server/pax/store';
import { pauseSearchAlerts } from '@/server/pax/unsubscribe';
export async function POST(req:Request){try{const input=z.object({id:z.string().regex(/^[a-f0-9]{64}$/),token:z.string().regex(/^[a-f0-9]{64}$/)}).strict().safeParse(await readBody(req));if(!input.success)throw new RequestError('Invalid alert link.',404);const {id,token}=input.data;
 const state=await readSession(id);if(!state||!pauseSearchAlerts(state,token))throw new RequestError('Invalid alert link.',404);
 await withSession(id,s=>{if(!pauseSearchAlerts(s,token))throw new RequestError('Invalid alert link.',404);});return Response.json({stopped:true},{headers:{'Cache-Control':'no-store'}});
}catch(e){return routeError(e);}}
