// Explicit deterministic test adapter. Never enabled by default, never allowed in production.
// This does not represent a live OpenAI conversation.
import { moreResults,resultDetails } from "./result-actions";
import { reviseCriteria,showMatches } from "./search-criteria";
import { searchSummary } from "../../lib/search-summary";
import { confirmAction } from "./state";
import type { PaxState } from "../../lib/pax";
import { search, home, propose, updatePreferences, flagHot } from "./state";
export async function testReply(state:PaxState,onText:(text:string)=>void){
 const text=state.messages.at(-1)?.text||"";const lower=text.toLowerCase();let reply:string;
 if(/^(hi|hello|hey|how are you)[!.? ]*$/i.test(lower)){reply="Hi! Glad you stopped by. What would make your next place feel like home?";}
 else if(lower==='find a home'){reply="Happy to help. What’s one must-have for your next home?";}
 else if(/number\s+\d+/.test(lower)){const result=resultDetails(state,Number(lower.match(/number\s+(\d+)/)![1]));reply=result.listing?`Number ${result.number} is ${result.listing.title}, a fictional sample in ${result.listing.city} listed at $${result.listing.price.toLocaleString('en-US')}. ${result.listing.description}`:result.error;}
 else if(lower.includes('show me more')){const result=moreResults(state);reply=result.message;}
 else if(lower.includes('just show me')){reviseCriteria(state,{},[],[],Object.keys(state.preferences));reply="Here are all five fictional samples to explore. Which catches your eye?";}
 else if(lower.includes("3 beds")&&lower.includes("boynton")){
  reviseCriteria(state,{areas:["Delray Beach","Boynton Beach"],maxPrice:650000,beds:3,baths:2,type:"SALE",mustHaves:["pool","no HOA"],timeline:"60 days",movingReason:"closer to work",notes:"Buyer wants to shorten the commute."});
  reply=`So, ${searchSummary(state.preferences)}. The Boynton sample has a pool, but HOA status is unverified. Is that right? Want new matching samples by email?`;
 }else if(lower.includes("add lake worth")||lower.includes("bump it to $700")){
  reviseCriteria(state,lower.includes("700")?{maxPrice:700000}:{},lower.includes("lake worth")?["Lake Worth Beach"]:[]);
  if(state.lead)propose(state,{kind:"SEARCH",contact:state.lead});
  reply=`Updated draft: ${searchSummary(state.preferences)}. Is this right? Confirm the card to update your saved search.`;
 }else if(lower==="yes"&&state.lead&&state.actions.some(a=>a.kind==="SEARCH"&&a.status==="pending")){
  const result=confirmAction(state,state.actions.find(a=>a.kind==="SEARCH"&&a.status==="pending")!.id,true);reply="message" in result?result.message!:"Saved.";
 }else if(lower.includes("pre-approved")){updatePreferences(state,{preApproved:true,timeline:"within 60 days",area:"Delray Beach",maxPrice:600000,beds:3});flagHot(state,"pre-approved");search(state,state.preferences);reply="Here’s a fictional Delray sample under $600,000. What would you most like to change about your current home?";}
 else if(lower.includes("sell first")){updatePreferences(state,{intent:"SELLER"});reply="Paul can help with a free home value report. What’s the property address?";}
 else if(lower.includes("showing")){flagHot(state,"showing requested");reply="These homes are fictional samples, so they can’t be toured. Would a call with Paul about comparable real homes help?";}
 else if(lower.includes("test@example.com")){
  const kind=lower.includes("call")?"CALL":(lower.includes("search")||state.alertRequested)?"SEARCH":"CONTACT";
  propose(state,{kind,contact:{email:"test@example.com"},...(kind==="CALL"?{preferredTime:"Saturday at 10 AM America/New_York"}:{})});
  reply="Please confirm the card below so Paul can follow up. Any call time still needs his confirmation.";
 }else if(/^no[.! ]*$/.test(lower)){reply="Of course. We can keep exploring. Which area would you like to compare?";}
 else if(lower.includes("save")&&state.results.length){home(state,state.results[0],true);reply="Saved here without signup. Would you like to compare another sample?";}
 else {updatePreferences(state,{area:lower.includes("delray")?"Delray Beach":undefined,maxPrice:lower.includes("600")?600000:undefined,type:lower.includes("lease")?"RENT":"SALE"});showMatches(state);reply="Here are matching fictional sample homes, with the same results on the map. What price range feels comfortable?";}
 for(const chunk of reply.match(/.{1,24}/g)||[]){onText(chunk);await new Promise(resolve=>setTimeout(resolve,5));}
 return reply;
}
