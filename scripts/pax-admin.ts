import "dotenv/config";
import { queueListingAlerts } from "../src/server/pax/listing-alerts";
import { listSessions,withSession,closePaxDb } from "../src/server/pax/store";
import { metrics,event,now } from "../src/server/pax/state";
import { flushNotifications,notificationHealth } from "../src/server/pax/notifications";
import { processFacebook } from "../src/server/pax/facebook";
async function main(){
 const command=process.argv[2]||"insights";
 if(command==="insights"){console.log(JSON.stringify(metrics(await listSessions()),null,2));return;}
 if(command==="inbox"){
  const sessions=await listSessions();
  for(const s of sessions.filter(s=>s.lead||s.notifications.length))console.log(JSON.stringify({conversation:s.id,contact:s.lead||"No contact yet",source:s.source||"WEBSITE",wanted:s.wanted,preferences:s.preferences,activity:s.activity,consent:s.communicationConsent,facebook:s.facebook,deliveries:s.notifications,viewed:s.viewed,saved:s.saved,requests:s.actions.filter(a=>a.status==="confirmed"),appointments:s.appointments,notifications:notificationHealth(s),transcript:s.messages},null,2));
  return;
 }
 if(command==="confirm"){
  const appointmentId=process.argv[3],confirmedTime=process.argv[4];
  if(!appointmentId||!confirmedTime||!/(Z|[+-]\d\d:\d\d)$/.test(confirmedTime)||Number.isNaN(Date.parse(confirmedTime))||Date.parse(confirmedTime)<=Date.now())throw new Error('Use: npm run pax:confirm -- APPOINTMENT_ID "2026-11-07T10:00:00-05:00" (future ISO time with timezone).');
  const session=(await listSessions()).find(s=>s.appointments.some(a=>a.id===appointmentId));if(!session)throw new Error("Appointment request not found.");
  await withSession(session.id,state=>{
   const a=state.appointments.find(a=>a.id===appointmentId)!;if(a.status==="CONFIRMED")throw new Error("Already confirmed. No duplicate conversion was recorded.");
   a.status="CONFIRMED";a.confirmedAt=new Date(confirmedTime).toISOString();event(state,"appointment_confirmed",a.id);
   state.messages.push({id:crypto.randomUUID(),role:"assistant",text:`Paul marked your call confirmed for ${new Date(confirmedTime).toLocaleString("en-US",{timeZone:"America/New_York",timeZoneName:"short"})}.`,at:now()});
  });
  console.log("Appointment marked confirmed. This does not send the visitor a message outside chat; contact them directly to confirm.");return;
 }
 if(command==="retry"||command==="worker"){
  async function retry(){for(const state of await listSessions()){if(state.lead&&state.searches.some(s=>s.status==="ACTIVE_SAMPLE"))try{await withSession(state.id,s=>queueListingAlerts(s));await flushNotifications(state.id);}catch{console.error("Listing alert pass deferred.");}if(state.facebook?.status==="pending")try{await processFacebook(state.id);}catch{console.error("Facebook intake retry deferred.");}if(state.notifications.some(n=>["pending","retry","unconfigured"].includes(n.status)))try{await flushNotifications(state.id);}catch{console.error("A conversation is busy or unavailable; the next retry will pick it up.");}}}
  await retry();if(command==="worker"){console.log("Pax notification retry worker is running. Keep this terminal open; Ctrl+C stops it.");setInterval(()=>void retry().catch(()=>console.error("Retry pass failed; will retry on the next interval.")),60000);}return;
 }
 throw new Error("Unknown Pax admin command.");
}
main().catch(e=>{console.error(e instanceof Error?e.message:"Pax command failed.");process.exitCode=1;}).finally(async()=>{if(process.argv[2]!=="worker")await closePaxDb();});
