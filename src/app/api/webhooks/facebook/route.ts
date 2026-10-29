import { after } from 'next/server';
import { validSignature,receiveFacebook,processFacebook } from '@/server/pax/facebook';
export const runtime='nodejs';
export async function GET(req:Request){
 const p=new URL(req.url).searchParams,token=process.env.FACEBOOK_VERIFY_TOKEN;
 if(token&&p.get('hub.mode')==='subscribe'&&p.get('hub.verify_token')===token)return new Response(p.get('hub.challenge')||'',{headers:{'Cache-Control':'no-store'}});
 return new Response('Verification failed',{status:403});
}
export async function POST(req:Request){
 if(!process.env.FACEBOOK_APP_SECRET||!process.env.FACEBOOK_PAGE_ID||!process.env.FACEBOOK_FORM_IDS)return new Response('Not configured',{status:503});
 const reader=req.body?.getReader();if(!reader)return new Response('Missing body',{status:400});
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>256000){await reader.cancel();return new Response('Too large',{status:413});}chunks.push(r.value);}
 const raw=Buffer.concat(chunks).toString('utf8');if(!validSignature(raw,req.headers.get('x-hub-signature-256')))return new Response('Invalid signature',{status:401});
 let body:unknown;try{body=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
 try{const ids=await receiveFacebook(body);after(async()=>{for(const id of ids)try{await processFacebook(id);}catch{/* Durable worker retries. */}});return Response.json({received:true});}
 catch{return new Response('Receipt not saved; retry required',{status:503});}
}
