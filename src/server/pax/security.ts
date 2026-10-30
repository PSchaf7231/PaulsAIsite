import { siteUrl } from "../../lib/config";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { PaxBusyError } from "./store";
export const COOKIE="pax_visitor";
export async function identity(create=false){
 const jar=await cookies();let token=jar.get(COOKIE)?.value;
 if(!token||! /^[a-f0-9]{64}$/.test(token)){
  if(!create)return null;token=randomBytes(32).toString("hex");
  jar.set(COOKIE,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});
 }
 return createHash("sha256").update(token).digest("hex");
}
export class RequestError extends Error{constructor(message:string,public status=400){super(message);}}
export async function readBody(req:Request){
 if(req.headers.get("origin")!==new URL(process.env.NEXT_PUBLIC_SITE_URL||process.env.SITE_URL||req.url).origin)throw new RequestError("This request must come from this website.",403);
 if(!req.headers.get("content-type")?.startsWith("application/json"))throw new RequestError("Expected JSON.",415);
 const reader=req.body?.getReader();if(!reader)throw new RequestError("Missing request.");
 let size=0,text="";const decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw new RequestError("Message is too large.",413);}text+=decoder.decode(value,{stream:true});}
 try{return JSON.parse(text+decoder.decode());}catch{throw new RequestError("Invalid JSON.");}
}
export function routeError(error:unknown){
 const status=error instanceof RequestError?error.status:error instanceof PaxBusyError?409:503;
 const message=error instanceof RequestError||error instanceof PaxBusyError?error.message:"Pax could not save or load this conversation. Please check setup or try again. You can still contact Paul directly.";
 return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
}
