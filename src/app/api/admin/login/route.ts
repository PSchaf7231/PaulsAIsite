import { cookies } from 'next/headers';
import { z } from 'zod';
import { ADMIN_COOKIE,loginAdmin } from '@/server/admin/auth';
import { readBody,routeError,RequestError } from '@/server/pax/security';
// Supabase also rate-limits password grants. This caps requests per app process.
let windowStart=0,attempts=0;
export async function POST(req:Request){try{
 const body=z.object({email:z.string().email().max(254),password:z.string().min(1).max(256)}).strict().safeParse(await readBody(req));if(!body.success)throw new RequestError('Enter your email and password.');
 if(Date.now()-windowStart>60000){windowStart=Date.now();attempts=0;}if(++attempts>20)throw new RequestError('Too many sign-in attempts. Try again in a minute.',429);
 const result=await loginAdmin(body.data.email,body.data.password);if(!result)throw new RequestError('Sign-in failed. Check your credentials and administrator access.',401);
 (await cookies()).set(ADMIN_COOKIE,result.token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/','maxAge':result.expires});
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}catch(e){return routeError(e);}}
