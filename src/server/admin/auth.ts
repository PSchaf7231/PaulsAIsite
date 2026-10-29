import { cookies } from 'next/headers';
export const ADMIN_COOKIE='pax_admin_access';
export function testAdmin(){return process.env.NODE_ENV!=='production'&&process.env.PAX_STORAGE==='local'&&process.env.PAX_TEST_MODE==='1'&&!!process.env.PAX_ADMIN_TEST_PASSWORD;}
export function adminConfigured(){return testAdmin()||!!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY&&process.env.PAX_ADMIN_EMAIL);}
function endpoint(){const url=new URL(process.env.SUPABASE_URL!);if(url.protocol!=='https:')throw new Error('Supabase requires HTTPS');return url.origin;}
export async function verifyAdminToken(token:string|undefined,fetcher:typeof fetch=fetch){
 if(!token||!adminConfigured())return false;
 if(testAdmin())return token===`test-${process.env.PAX_ADMIN_TEST_PASSWORD}`;
 try{
  const r=await fetcher(`${endpoint()}/auth/v1/user`,{headers:{apikey:process.env.SUPABASE_ANON_KEY!,Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!r.ok)return false;const user=await r.json();return !!user.id&&!!user.email_confirmed_at&&user.email?.toLowerCase()===process.env.PAX_ADMIN_EMAIL!.toLowerCase();
 }catch{return false;}
}
export async function isAdmin(){return verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);}
export async function loginAdmin(email:string,password:string,fetcher:typeof fetch=fetch):Promise<{token:string;expires:number}|null>{
 if(!adminConfigured()||email.toLowerCase()!==(process.env.PAX_ADMIN_EMAIL||'').toLowerCase())return null;
 if(testAdmin())return password===process.env.PAX_ADMIN_TEST_PASSWORD?{token:`test-${password}`,expires:3600}:null;
 const r=await fetcher(`${endpoint()}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:process.env.SUPABASE_ANON_KEY!,'Content-Type':'application/json'},body:JSON.stringify({email,password}),signal:AbortSignal.timeout(10000),cache:'no-store'});
 if(!r.ok)return null;const body=await r.json();if(typeof body.access_token!=='string'||!await verifyAdminToken(body.access_token,fetcher))return null;
 return {token:body.access_token,expires:Math.max(1,Math.min(3600,Number(body.expires_in)||3600))};
}
