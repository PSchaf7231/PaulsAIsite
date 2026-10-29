import { identity,readBody,routeError,RequestError } from '@/server/pax/security';
import { withSession } from '@/server/pax/store';
import { activitySchema,trackActivity } from '@/server/pax/conversion';
export async function POST(req:Request){try{
 const parsed=activitySchema.safeParse(await readBody(req));if(!parsed.success)throw new RequestError('Invalid activity.');
 const id=(await identity(true))!;
 const result=await withSession(id,state=>{
  if(state.events.length>1500)throw new RequestError('Activity limit reached.',429);
  return trackActivity(state,parsed.data);
 });
 return Response.json(result.value,{headers:{'Cache-Control':'no-store'}});
}catch(e){return routeError(e);}}
