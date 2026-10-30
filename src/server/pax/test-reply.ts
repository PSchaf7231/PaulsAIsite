// Explicit deterministic test adapter. Never enabled by default, never allowed in production.
// This does not represent a live OpenAI conversation.
import { queryInventory } from "./inventory";
import { recordSeller } from "./seller";
import { requestPageAction } from "./page-actions";
import { paxTools } from "./tools";
import { moreResults,resultDetails } from "./result-actions";
import { reviseCriteria,showMatches } from "./search-criteria";
import { searchSummary } from "../../lib/search-summary";
import { confirmAction } from "./state";
import type { PaxState } from "../../lib/pax";
import { search, home, propose, updatePreferences, flagHot } from "./state";
export async function testReply(state:PaxState,onText:(text:string)=>void){
 const text=state.messages.at(-1)?.text||"";const lower=text.toLowerCase();let reply:string;
 if(/(?:open|show).*photos|scroll to|next result/.test(lower)){
  const kind=lower.includes('photos')?'photos':lower.includes('next result')?'next':lower.includes('outdoor')?'outdoor':lower.includes('interior')?'interior':lower.includes('location')?'location':'overview';
  const result=requestPageAction(state,kind,text);reply=result.error?result.error:"I’ll open that for you. Your conversation will be here when you return.";
 }else if(lower.includes('nearby')){reply="This is a fictional sample address, so nearby places and travel times aren’t verified. What kind of place would you like Paul to check?";}
 else if(lower.includes('payment')){reply="I can estimate a payment using your assumptions. How much would you plan to put down?";}
 else if(lower.includes('compare to my saved')){const result=await paxTools(state).compare_saved_homes.execute!({},{} as never);reply=JSON.stringify(result);}
 else if(/^(hi|hello|hey|how are you)[!.? ]*$/i.test(lower)){reply="Hi! Glad you stopped by. What would make your next place feel like home?";}
 else if(lower==='find a home'||/^i[’']m buying/.test(lower)){reply="Happy to help. What’s one must-have for your next home?";}
 else if(/number\s+\d+/.test(lower)){const result=resultDetails(state,Number(lower.match(/number\s+(\d+)/)![1]));reply=result.listing?`Number ${result.number} is ${result.listing.title}, a fictional sample in ${result.listing.city} listed at $${result.listing.price.toLocaleString('en-US')}. ${result.listing.description}`:result.error;}
 else if(lower.includes('show me more')){const result=moreResults(state);reply=result.message;}
 else if(lower.includes('just show me')){reviseCriteria(state,{},[],[],Object.keys(state.preferences));await queryInventory(state);reply="Here are all five fictional samples to explore. Which catches your eye?";}
 else if(lower.includes('123 palm way')){recordSeller(state,{address:'123 Palm Way, Delray Beach',timeline:'60 days',reason:'downsizing',alsoBuying:true},text);reply="I’ve noted the address, your 60-day timing, and that you’re downsizing and also buying. Paul can review recent comparable sales and condition with you. Want a free local pricing review by email?";}
 else if(lower.includes("3 beds")&&lower.includes("boynton")){
  reviseCriteria(state,{areas:["Delray Beach","Boynton Beach"],maxPrice:650000,beds:3,baths:2,type:"SALE",mustHaves:["pool","no HOA"],timeline:"60 days",movingReason:"closer to work",notes:"Buyer wants to shorten the commute."});await queryInventory(state);
  reply=`So, ${searchSummary(state.preferences)}. The Boynton sample has a pool, but HOA status is unverified. Is that right? Want new matching samples by email?`;
 }else if(lower.includes("add lake worth")||lower.includes("bump it to $700")){
  reviseCriteria(state,lower.includes("700")?{maxPrice:700000}:{},lower.includes("lake worth")?["Lake Worth Beach"]:[]);
  await queryInventory(state);if(state.lead)propose(state,{kind:"SEARCH",contact:state.lead});
  reply=`Updated draft: ${searchSummary(state.preferences)}. Is this right? Confirm the card to update your saved search.`;
 }else if(lower==="yes"&&state.lead&&state.actions.some(a=>a.kind==="SEARCH"&&a.status==="pending")){
  const result=confirmAction(state,state.actions.find(a=>a.kind==="SEARCH"&&a.status==="pending")!.id,true);reply="message" in result?result.message!:"Saved.";
 }else if(lower.includes("pre-approved")){updatePreferences(state,{preApproved:true,timeline:"within 60 days",area:"Delray Beach",maxPrice:600000,beds:3});flagHot(state,"pre-approved");await queryInventory(state);reply="Here’s a fictional Delray sample under $600,000. What would you most like to change about your current home?";}
 else if(lower.includes("sell first")||/^i[’']m selling/.test(lower)){updatePreferences(state,{intent:"SELLER"});reply="A useful first step is comparing recent closed sales and your home’s condition. Paul can help with a free local pricing review. What’s the property address?";}
 else if(lower.includes("showing")){flagHot(state,"showing requested");reply="These homes are fictional samples, so they can’t be toured. Would a call with Paul about comparable real homes help?";}
 else if(lower.includes("test@example.com")){
  const kind=lower.includes("call")?"CALL":(lower.includes("search")||state.alertRequested)?"SEARCH":"CONTACT";
  propose(state,{kind,contact:{email:"test@example.com"},...(kind==="CALL"?{preferredTime:"Saturday at 10 AM America/New_York"}:{})});
  reply="Please confirm the card below so Paul can follow up. Any call time still needs his confirmation.";
 }else if(/^no[.! ]*$/.test(lower)){reply="Of course. We can keep exploring. Which area would you like to compare?";}
 else if(lower.includes("save")&&state.results.length){home(state,state.results[0],true);reply="Saved here without signup. Would you like to compare another sample?";}
 else {updatePreferences(state,{area:lower.includes("delray")?"Delray Beach":undefined,maxPrice:lower.includes("600")?600000:undefined,type:lower.includes("lease")?"RENT":"SALE"});await queryInventory(state);reply="Here are matching fictional sample homes, with the same results on the map. What price range feels comfortable?";}
 for(const chunk of reply.match(/.{1,24}/g)||[]){onText(chunk);await new Promise(resolve=>setTimeout(resolve,5));}
 return reply;
}
