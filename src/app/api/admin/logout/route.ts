import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/server/admin/auth';
import { readBody,routeError } from '@/server/pax/security';
export async function POST(req:Request){try{await readBody(req);(await cookies()).delete(ADMIN_COOKIE);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});}catch(e){return routeError(e);}}
