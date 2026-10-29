import { after } from "next/server";
import { z } from "zod";
import { readBody,identity,routeError,RequestError } from "@/server/pax/security";
import { withSession } from "@/server/pax/store";
import { confirmAction,home,event,now } from "@/server/pax/state";
import { publicPaxState } from "@/lib/pax";
import { flushNotifications } from "@/server/pax/notifications";
import { randomUUID } from "node:crypto";
const schema=z.discriminatedUnion("type",[
 z.object({type:z.literal("confirm"),actionId:z.string().uuid(),accepted:z.boolean()}).strict(),
 z.object({type:z.enum(["save","view"]),slug:z.string().min(1).max(100)}).strict()
]);
export async function POST(req:Request){try{
 const input=schema.safeParse(await readBody(req));if(!input.success)throw new RequestError("Invalid action.");
 const data=input.data;
 const id=await identity();if(!id)throw new RequestError("Start a chat before saving your preferences.",401);
 const result=await withSession(id,state=>{
  if(!state.messages.length)throw new RequestError("Start a chat first.",401);
  if(data.type==="confirm"){
   const previous=state.actions.find(a=>a.id===data.actionId);if(!previous)throw new RequestError("This action does not belong to your chat.",404);
   const wasPending=previous.status==="pending";
   const response=confirmAction(state,data.actionId,data.accepted);
   if(wasPending&&"message" in response)state.messages.push({id:randomUUID(),role:"assistant",text:response.message!,at:now()});
   return response;
  }
  if(state.events.length>1200)throw new RequestError("This conversation has reached its activity limit.",429);
  const alreadySaved=state.saved.includes(data.slug);
  const result=home(state,data.slug,data.type==="save");if("error" in result)throw new RequestError(result.error||"Unknown listing.",404);
  if(data.type==="save"){
   event(state,"conversion_trigger","save_home");
   const turns=state.messages.filter(m=>m.role==="user").length;
   if(!alreadySaved&&turns-state.declinedAtTurn>=3&&turns-state.lastAskTurn>=3){
    state.messages.push({id:randomUUID(),role:"assistant",text:"Saved here—no signup needed. Want Paul to help find real homes like this?",at:now()});state.lastAskTurn=turns;
   }
  }
  return {status:"saved"};
 });
 after(async()=>{try{await flushNotifications(id);}catch{/* Worker retries the durable outbox. */}});
 return Response.json({session:publicPaxState(result.state),result:result.value},{headers:{"Cache-Control":"no-store"}});
}catch(error){return routeError(error);}}
