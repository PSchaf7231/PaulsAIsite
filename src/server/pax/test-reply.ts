// Explicit deterministic test adapter. Never enabled by default, never allowed in production.
// This does not represent a live OpenAI conversation.
import type { PaxState } from "../../lib/pax";
import { search, home, propose, updatePreferences, flagHot } from "./state";
export async function testReply(state:PaxState,onText:(text:string)=>void){
 const text=state.messages.at(-1)?.text||"";const lower=text.toLowerCase();let reply:string;
 if(lower.includes("pre-approved")){updatePreferences(state,{preApproved:true,timeline:"within 60 days",area:"Delray Beach",maxPrice:600000,beds:3});flagHot(state,"pre-approved");search(state,state.preferences);reply="Here’s a fictional Delray sample under $600,000. What would you most like to change about your current home?";}
 else if(lower.includes("sell first")){updatePreferences(state,{intent:"SELLER"});reply="Paul can help with a free home value report. What’s the property address?";}
 else if(lower.includes("showing")){flagHot(state,"showing requested");reply="These homes are fictional samples, so they can’t be toured. Would a call with Paul about comparable real homes help?";}
 else if(lower.includes("test@example.com")){
  const kind=lower.includes("call")?"CALL":lower.includes("search")?"SEARCH":"CONTACT";
  propose(state,{kind,contact:{email:"test@example.com"},...(kind==="CALL"?{preferredTime:"Saturday at 10 AM America/New_York"}:{})});
  reply="Please confirm the card below so Paul can follow up. Any call time still needs his confirmation.";
 }else if(/^no[.! ]*$/.test(lower)){reply="Of course. We can keep exploring. Which area would you like to compare?";}
 else if(lower.includes("save")&&state.results.length){home(state,state.results[0],true);reply="Saved here without signup. Would you like to compare another sample?";}
 else {search(state,{area:lower.includes("delray")?"Delray Beach":undefined,maxPrice:lower.includes("600")?600000:undefined,type:lower.includes("lease")?"RENT":"SALE"});reply="Here are matching fictional sample homes, with the same results on the map. What price range feels comfortable?";}
 for(const chunk of reply.match(/.{1,24}/g)||[]){onText(chunk);await new Promise(resolve=>setTimeout(resolve,5));}
 return reply;
}
