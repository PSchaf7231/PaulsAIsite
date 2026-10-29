import samples from "@/lib/sample-listings.json";
import { communities } from "@/lib/communities";
import { after } from "next/server";
import { z } from "zod";
import { readBody,identity,routeError,RequestError } from "@/server/pax/security";
import { withSession } from "@/server/pax/store";
import { streamPax } from "@/server/pax/agent";
import { prepareTurn,finishTurn } from "@/server/pax/turn";
import { publicPaxState } from "@/lib/pax";
import { flushNotifications,dispatchQueued } from "@/server/pax/notifications";
export const runtime="nodejs";
export async function POST(req:Request){try{
 const input=z.object({text:z.string().trim().min(1).max(2000),turnId:z.string().uuid(),consent:z.literal(true),listingSlug:z.string().max(100).optional(),area:z.string().max(100).optional()}).strict().safeParse(await readBody(req));
 if(!input.success)throw new RequestError("Send a short message and acknowledge the chat privacy notice.");
 if(!process.env.OPENAI_API_KEY&&process.env.PAX_TEST_MODE!=="1")return Response.json({error:"Pax is not connected to OpenAI yet. You can browse the five samples or contact Paul directly."},{status:503});
 if(process.env.PAX_TEST_MODE==="1"&&(process.env.NODE_ENV==="production"||process.env.PAX_STORAGE!=="local"))throw new RequestError("Test mode is not available here.",503);
 const id=(await identity(true))!;const encoder=new TextEncoder();
 const stream=new ReadableStream({async start(controller){
  let connected=true;
  const send=(value:unknown)=>{if(connected)try{controller.enqueue(encoder.encode(JSON.stringify(value)+"\n"));}catch{connected=false;}};
  try{
   const {state}=await withSession(id,async (state,checkpoint)=>{
    if(!prepareTurn(state,input.data.turnId,input.data.text))return;
    state.currentPage={listingSlug:samples.find(l=>l.slug===input.data.listingSlug)?.slug,area:communities.find(c=>c.name===input.data.area)?.name};
    await checkpoint();
    await dispatchQueued(state,checkpoint);
    await checkpoint();
    const text=await streamPax(state,chunk=>send({type:"text",text:chunk}),AbortSignal.any([req.signal,AbortSignal.timeout(65000)]),checkpoint);
    finishTurn(state,input.data.turnId,text);
   });
   send({type:"done",session:publicPaxState(state)});
   after(async()=>{try{await flushNotifications(id);}catch{/* Durable queue remains for the retry worker. */}});
  }catch(error){send({type:"error",error:error instanceof RequestError?error.message:"Pax couldn’t complete that reply. Please retry; your previous conversation is safe. Paul is also available directly."});}
  finally{if(connected)controller.close();}
 }});
 return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}catch(error){return routeError(error);}}
