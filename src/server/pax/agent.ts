import { ToolLoopAgent, isStepCount, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { PaxState } from "../../lib/pax";
import { paxSystemPrompt } from "./prompt";
import { paxTools } from "./tools";
import { dispatchQueued } from "./notifications";
export async function streamPax(state:PaxState,onText:(text:string)=>void,signal:AbortSignal,checkpoint:()=>Promise<void>=async()=>{}){
 if(process.env.PAX_TEST_MODE==="1"){
  if(process.env.NODE_ENV==="production"||process.env.PAX_STORAGE!=="local")throw new Error("Test mode is restricted to local development storage.");
  const {testReply}=await import("./test-reply");
  return testReply(state,onText);
 }
 if(!process.env.OPENAI_API_KEY)throw new Error("OpenAI is not configured.");
 const openai=createOpenAI({apiKey:process.env.OPENAI_API_KEY});
 const agent=createPaxAgent(state,openai.chat(process.env.OPENAI_MODEL||"gpt-4o"),checkpoint);
 const result=await agent.stream({messages:state.messages.slice(-40).map(m=>({role:m.role,content:m.text})),abortSignal:signal,timeout:60000});
 let text="";
 for await(const part of result.fullStream){
  if(part.type==="text-delta"){text+=part.text;onText(part.text);}
  if(part.type==="error")throw new Error("The AI service could not complete the reply.");
 }
 if(!text.trim())throw new Error("No reply was returned. Please try again.");
 return text;
}

export function createPaxAgent(state:PaxState,model:LanguageModel,checkpoint:()=>Promise<void>=async()=>{}){
 return new ToolLoopAgent({
  model,instructions:paxSystemPrompt(state),tools:paxTools(state,async()=>{await checkpoint();await dispatchQueued(state);await checkpoint();}),
  onError:()=>{},onStepFinish:async()=>{await checkpoint();},stopWhen:isStepCount(5),toolCallConcurrency:1,maxOutputTokens:700,maxRetries:1,
 });
}
