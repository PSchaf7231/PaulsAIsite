import { identity,routeError } from '@/server/pax/security';
import { readSession } from '@/server/pax/store';
import { getListing } from '@/server/listings/service';
import { homeSummary } from '@/server/pax/home-summary';
export async function GET(_req:Request,{params}:{params:Promise<{slug:string}>}){try{
 const {slug}=await params;const home=await getListing(slug);if(!home)return Response.json({error:'Listing not found'},{status:404});
 const id=await identity(),state=id?await readSession(id):null;
 return Response.json({summary:homeSummary(home,state?.preferences)},{headers:{'Cache-Control':'private, no-store','Vary':'Cookie'}});
}catch(e){return routeError(e);}}
