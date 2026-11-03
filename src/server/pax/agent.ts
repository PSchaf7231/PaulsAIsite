import { ToolLoopAgent, isStepCount, type LanguageModel } from "ai";
import { createPaxModel } from "./provider";
import type { PaxState } from "../../lib/pax";
import { paxSystemPrompt } from "./prompt";
import { buyerPaxTools } from "./tools";
import { dispatchQueued } from "./notifications";
export async function streamPax(state:PaxState,onText:(text:string)=>void,signal:AbortSignal,checkpoint:()=>Promise<void>=async()=>{},persona?:"madison"){
 if(process.env.PAX_TEST_MODE==="1"){
  if(process.env.NODE_ENV==="production"||process.env.PAX_STORAGE!=="local")throw new Error("Test mode is restricted to local development storage.");
  const {testReply}=await import("./test-reply");
  return testReply(state,onText);
 }
 const agent=createPaxAgent(state,createPaxModel(persona),checkpoint,persona);
 const result=await agent.stream({messages:state.messages.slice(-40).map(m=>({role:m.role,content:m.text})),abortSignal:signal,timeout:60000});
 let text="";
 for await(const part of result.fullStream){
  if(part.type==="text-delta"){text+=part.text;onText(part.text);}
  if(part.type==="error")throw new Error("The AI service could not complete the reply.");
 }
 if(!text.trim())throw new Error("No reply was returned. Please try again.");
 return text;
}

export function createPaxAgent(state:PaxState,model:LanguageModel,checkpoint:()=>Promise<void>=async()=>{},persona?:"madison"){
 return new ToolLoopAgent({
  model,instructions:paxSystemPrompt(state)+(persona==="madison"?"\nVOICE PRESENTATION: You are Madison, private client concierge for Paul's team at Palm Beach Real Estate Pros, serving Palm Beach County, Florida. You are an AI assistant; say so plainly if asked. Refer to Paul by first name only; never speak his last name. Do not introduce yourself as Pax or as being with Pax. Be warm, upbeat, polished and quick. Keep each reply to one or two short natural sentences, with no markdown. First greeting: Hi, I'm Madison with Paul's team. Are you looking to buy, sell, or invest in Palm Beach County? Learn their town, price range, timeline and whether they already work with an agent, one question at a time. Help with buying, renting or investing; refer sellers to Paul without adding seller tools. Share general area and process information. Offer a call with Paul when helpful; ask for name and preferred contact after helping, using existing property-linked confirmation controls. Never quote exact property prices, values or availability aloud; say Paul will confirm the latest details. No legal, tax, lending or inspection advice; refer to the appropriate professional. Follow fair housing: discuss homes and areas, never steer by race, religion, family status, disability, national origin or other protected characteristics. Say Boca in speech instead of Boca Raton, retaining canonical city names in tool inputs. When giving Paul's number, say it slowly in groups: five six one ... two five five ... seven two eight five. All Pax buyer tools, consent, grounding, and property-follow-up rules still apply.":""),tools:buyerPaxTools(state,async()=>{await checkpoint();await dispatchQueued(state,checkpoint);await checkpoint();}),
  onError:()=>{},onStepFinish:async()=>{await checkpoint();},stopWhen:isStepCount(5),toolCallConcurrency:1,maxOutputTokens:700,maxRetries:1,
 });
}
