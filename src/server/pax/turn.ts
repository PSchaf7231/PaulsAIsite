import { randomUUID } from "node:crypto";
import type { PaxState } from "../../lib/pax";
import { event, now, flagHot, search } from "./state";
import { RequestError } from "./security";
export function prepareTurn(state:PaxState,turnId:string,text:string){
 const existing=state.messages.find(m=>m.id===turnId);
 if(existing&&existing.text!==text)throw new RequestError("A retry must use the same message.");
 if(state.processedTurns.includes(turnId))return false;
 if(existing)return true;
 const recent=state.messages.filter(m=>m.role==="user"&&Date.parse(m.at)>Date.now()-3600000);
 if(recent.length>=30)throw new RequestError("You’ve reached this chat’s hourly limit. Please contact Paul directly or try again later.",429);
 if(state.messages.length>=160)throw new RequestError("This conversation has reached its limit. Please contact Paul directly.",429);
 state.messages.push({id:turnId,role:"user",text,at:now()});
 if(/\b(?:we|i) (?:need|have) to sell first\b/i.test(text))state.preferences.intent="SELLER";
 if(state.messages.filter(m=>m.role==="user").length===1){event(state,"chat_started");event(state,"chat_consent","pax-privacy-v2");}
 if(/^(no( thanks| thank you)?|not now|just browsing|stop asking)[.! ]*$/i.test(text.trim()))state.declinedAtTurn=state.messages.filter(m=>m.role==="user").length;
 // Only explicit positive statements, not negated or hypothetical phrases, qualify automatically.
 if(/\b(i am|i'm|we are|we're)\s+(already\s+)?pre[- ]?approved\b/i.test(text)){
  state.preferences.preApproved=true;flagHot(state,"pre-approved");
 }
 if(/\b(i|we)\s+(want|would like|need)\s+(to\s+)?(schedule|book|request)\s+(a\s+)?showing\b/i.test(text))flagHot(state,"showing requested");
 const moving=text.match(/\b(?:moving|move|relocating)\s+(?:in|within)\s+(\d{1,3})\s+days\b/i);
 if(moving&&Number(moving[1])<=90&&!/\b(not|don't|won't|might)\b/i.test(text)){state.preferences.timeline=`within ${moving[1]} days`;flagHot(state,"moving within 90 days");}
 return true;
}
export function finishTurn(state:PaxState,turnId:string,text:string){
 // Ensure useful sample records are present by the second buying/browsing exchange, even if the model skipped search.
 const turns=state.messages.filter(m=>m.role==="user").length;
 if(turns<=2&&!state.events.some(e=>e.kind==="search")&&state.preferences.intent!=="SELLER")search(state,state.preferences);
 state.messages.push({id:randomUUID(),role:"assistant",text,at:now()});state.processedTurns.push(turnId);
}
