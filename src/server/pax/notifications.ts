import type { Notification, PaxState } from "../../lib/pax";
import { agent } from "../../lib/config";
import { withSession } from "./store";
export async function deliverNotification(n:Notification,fetcher:typeof fetch=fetch){
 const mode=process.env.PAX_NOTIFICATIONS||"off";
 if(mode==="off")return {status:"unconfigured" as const};
 if(mode==="preview"){
  if(process.env.NODE_ENV==="production")return {status:"unconfigured" as const};
  return {status:"preview" as const};
 }
 let response:Response;
 if(mode==="email"){
  if(!process.env.RESEND_API_KEY||!process.env.RESEND_FROM||!process.env.PAX_AGENT_EMAIL)return {status:"unconfigured" as const};
  response=await fetcher("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":n.id},body:JSON.stringify({from:process.env.RESEND_FROM,to:[process.env.PAX_AGENT_EMAIL],subject:"Pax: a visitor needs your attention",text:`${n.summary}\n\nOpen your local Pax inbox for the conversation. ${agent.name}`}),signal:AbortSignal.timeout(10000)});
 }else if(mode==="sms"){
  const account=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_FROM_NUMBER,to=process.env.PAX_AGENT_PHONE;
  if(!account||!token||!from||!to)return {status:"unconfigured" as const};
  response=await fetcher(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(account)}/Messages.json`,{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${account}:${token}`).toString("base64")}`,"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({From:from,To:to,Body:n.summary}),signal:AbortSignal.timeout(10000)});
 }else return {status:"unconfigured" as const};
 if(!response.ok)throw new Error(`Notification provider returned ${response.status}`);
 const result=await response.json();if(!result.id&&!result.sid)throw new Error("Notification provider did not acknowledge the message.");return {status:"sent" as const,providerId:String(result.id||result.sid)};
}
export async function flushNotifications(id:string){
 return withSession(id,dispatchQueued);
}
export async function dispatchQueued(state:PaxState,checkpoint:()=>Promise<void>=async()=>{}){
  let processed=0;
  for(const n of state.notifications){
   if(!["pending","retry","unconfigured"].includes(n.status)||Date.parse(n.nextAttemptAt)>Date.now()||processed>=4)continue;
   processed++;
   try{const result=await deliverNotification(n);Object.assign(n,result);if(result.status==="sent")n.attempts++;}
   catch{n.attempts++;n.status=n.attempts>=5?"failed":"retry";n.nextAttemptAt=new Date(Date.now()+Math.min(3600000,30000*2**n.attempts)).toISOString();}
   await checkpoint();
  }
}
export function notificationHealth(state:PaxState){return state.notifications.reduce((counts,n)=>({...counts,[n.status]:(counts[n.status]||0)+1}),{} as Record<string,number>);}
