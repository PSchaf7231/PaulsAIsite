import { beforeEach,afterEach,describe,it,expect,vi } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { newState,search,home,propose,confirmAction,metrics,flagHot,now } from "../src/server/pax/state";
import { readSession,withSession,PaxBusyError } from "../src/server/pax/store";
import { deliverNotification,dispatchQueued } from "../src/server/pax/notifications";
import { affordability } from "../src/server/pax/tools";
import { prepareTurn,finishTurn } from "../src/server/pax/turn";
import { paxSystemPrompt } from "../src/server/pax/prompt";
import { createPaxAgent,streamPax } from "../src/server/pax/agent";
import { MockLanguageModelV4 } from "ai/test";
import { readBody } from "../src/server/pax/security";
const id="a".repeat(64);
beforeEach(()=>vi.stubEnv("PAX_SMS_MODE","twilio"));
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
function contactState(){const s=newState(id);s.messages.push({id:randomUUID(),role:"user",text:"Please contact me at test@example.com",at:now()});return s;}
describe("Pax conversion boundaries",()=>{
 it("returns exact sample records and never fabricates an unmatched home",()=>{
  const s=newState(id);expect(search(s,{area:"Delray Beach",maxPrice:600000,beds:3}).listings.map(l=>l.slug)).toEqual(["delray-courtyard"]);
  expect(search(s,{area:"Jupiter",maxPrice:1000}).listings).toEqual([]);
  expect(home(s,"invented-home",true)).toHaveProperty("error");expect(s.saved).toEqual([]);
 });
 it("saves without contact and attaches previous interest when contact is confirmed",()=>{
  const s=contactState();home(s,"delray-courtyard");home(s,"delray-courtyard",true);
  const a=propose(s,{kind:"CONTACT",contact:{email:"test@example.com"}});if("error" in a)throw Error(a.error);
  expect(s.lead).toBeUndefined();confirmAction(s,a.id,true);confirmAction(s,a.id,true);
  expect(s.lead?.email).toBe("test@example.com");expect(s.saved).toEqual(["delray-courtyard"]);expect(s.viewed).toEqual(["delray-courtyard"]);
  expect(s.events.filter(e=>e.kind==="lead_captured")).toHaveLength(1);expect(s.notifications).toHaveLength(2);
 });
 it("rejects invented contact and cannot schedule a fictional sample",()=>{
  const s=contactState();expect(propose(s,{kind:"CONTACT",contact:{email:"invented@example.com"}})).toHaveProperty("error");
  expect(propose(s,{kind:"SHOWING",contact:{email:"test@example.com"},listingSlug:"delray-courtyard"})).toHaveProperty("error");
  expect(s.lead).toBeUndefined();expect(s.appointments).toHaveLength(0);
 });
 it("declining never captures a lead and enforces a cooldown",()=>{
  const s=contactState();const a=propose(s,{kind:"CONTACT",contact:{email:"test@example.com"}});if("error" in a)throw Error(a.error);
  confirmAction(s,a.id,false);expect(s.lead).toBeUndefined();expect(propose(s,{kind:"SEARCH",contact:{email:"test@example.com"}})).toHaveProperty("error");
  expect(search(s,{}).listings).toHaveLength(3);
 });
 it("separates requested calls from actual appointments and stores sample-only search criteria",()=>{
  const s=contactState();s.preferences={area:"Delray Beach",timeline:"60 days",maxPrice:600000};
  const a=propose(s,{kind:"CALL",contact:{email:"test@example.com"},preferredTime:"Saturday 10 AM Eastern"});if("error" in a)throw Error(a.error);confirmAction(s,a.id,true);
  const b=propose(s,{kind:"SEARCH",contact:{email:"test@example.com"}});if("error" in b)throw Error(b.error);confirmAction(s,b.id,true);
  expect(s.searches[0].status).toBe("ACTIVE_SAMPLE");expect(metrics([s])).toMatchObject({chats:1,leads:1,leadsWithAppointmentRequests:1,leadsWithConfirmedAppointments:0,leadsToAppointments:0});
  s.appointments[0].status="CONFIRMED";expect(metrics([s]).leadsToAppointments).toBe(1);
 });
 it("deduplicates retries and detects explicit hot signals without treating a negative as positive",()=>{
  const s=newState(id),turn=randomUUID();expect(prepareTurn(s,turn,"I'm pre-approved and moving within 60 days")).toBe(true);
  expect(s.notifications).toHaveLength(4);expect(prepareTurn(s,turn,"I'm pre-approved and moving within 60 days")).toBe(true);expect(s.messages).toHaveLength(1);
  finishTurn(s,turn,"Here are the samples.");expect(prepareTurn(s,turn,"I'm pre-approved and moving within 60 days")).toBe(false);
  const negative=newState("b".repeat(64));prepareTurn(negative,randomUUID(),"I'm not pre-approved and I'm not moving within 60 days");expect(negative.notifications).toHaveLength(0);
 });
 it("limits costs per conversation and calculates only an explicit illustration",()=>{
  const s=newState(id);for(let i=0;i<30;i++)prepareTurn(s,randomUUID(),"hello");expect(()=>prepareTurn(s,randomUUID(),"again")).toThrow("hourly limit");
  expect(affordability({price:120000,downPayment:0,annualRate:0,years:10,monthlyTaxesInsuranceHoa:200})).toMatchObject({principalAndInterest:1000,estimatedMonthlyTotal:1200});
  expect(affordability({price:100,downPayment:200,annualRate:1,years:10,monthlyTaxesInsuranceHoa:0})).toHaveProperty("error");
 });
 it("contains conversion, refusal, grounding, buyer, and honest completion instructions",()=>{
  const prompt=paxSystemPrompt(newState(id));for(const term of ["VALUE FIRST","one short question","BUYER HELP AND HOT LEADS","FIVE FICTIONAL SAMPLE LISTINGS","not booked","Never trap the search","DIFFERENT benefit"])expect(prompt).toContain(term);
 });
});
describe("durability and request security",()=>{
 it("persists checkpoints across failures and prevents concurrent session writes",async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),"pax-test-"));vi.stubEnv("PAX_STORAGE","local");vi.stubEnv("PAX_LOCAL_DIRECTORY",dir);
  try{
   await expect(withSession(id,async(s,checkpoint)=>{prepareTurn(s,randomUUID(),"Hello");await checkpoint();throw Error("provider unavailable");})).rejects.toThrow();
   expect((await readSession(id))?.messages).toHaveLength(1);
   let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let entered!:()=>void;const ready=new Promise<void>(resolve=>{entered=resolve;});
   const first=withSession(id,async s=>{entered();await gate;home(s,"delray-courtyard",true);});await ready;
   await expect(withSession(id,()=>{})).rejects.toBeInstanceOf(PaxBusyError);release();await first;
   expect((await readSession(id))?.saved).toEqual(["delray-courtyard"]);expect(await readSession("b".repeat(64))).toBeNull();
  }finally{await rm(dir,{recursive:true,force:true});}
 });
 it("rejects cross-origin writes and oversized or invalid JSON",async()=>{
  await expect(readBody(new Request("http://localhost/api/pax/chat",{method:"POST",headers:{origin:"https://evil.example","content-type":"application/json"},body:"{}"}))).rejects.toMatchObject({status:403});
  await expect(readBody(new Request("http://localhost/api/pax/chat",{method:"POST",headers:{origin:"http://localhost","content-type":"application/json"},body:JSON.stringify({text:"x".repeat(17000)})}))).rejects.toMatchObject({status:413});
 });
});
describe("Paul notification delivery",()=>{
 it("does not claim delivery when no provider is configured",async()=>{
  vi.stubEnv("PAX_NOTIFICATIONS","off");const s=contactState();flagHot(s,"pre-approved");await dispatchQueued(s);expect(s.notifications[0].status).toBe("unconfigured");
 });
 it("sends to configured Paul address and uses the same idempotency key on retry",async()=>{
  vi.stubEnv("PAX_NOTIFICATIONS","email");vi.stubEnv("RESEND_API_KEY","unit-test");vi.stubEnv("RESEND_FROM","Pax <pax@example.com>");vi.stubEnv("PAX_AGENT_EMAIL","paul@example.com");
  const s=contactState();flagHot(s,"pre-approved");const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({id:"provider-id"}),{status:200}));
  expect(await deliverNotification(s.notifications[0],fetcher)).toMatchObject({status:"sent"});
  const options=fetcher.mock.calls[0][1];expect(JSON.parse(options.body).to).toEqual(["paul@example.com"]);expect(options.headers["Idempotency-Key"]).toBe(s.notifications[0].id);
  const failing=vi.fn().mockResolvedValue(new Response("bad",{status:503}));await expect(deliverNotification(s.notifications[0],failing)).rejects.toThrow("503");
 });
});
it("executes search through the real SDK agent loop with a deterministic model",async()=>{
 const usage={inputTokens:{total:10,noCache:10,cacheRead:undefined,cacheWrite:undefined},outputTokens:{total:5,text:5,reasoning:undefined}};
 const model=new MockLanguageModelV4({doGenerate:[
  {content:[{type:"tool-call",toolCallId:"search-1",toolName:"search_listings",input:JSON.stringify({area:"Delray Beach",maxPrice:600000,beds:3})}],finishReason:{unified:"tool-calls",raw:undefined},usage,warnings:[]},
  {content:[{type:"text",text:"Here is a fictional Delray sample. What is your timeline?"}],finishReason:{unified:"stop",raw:undefined},usage,warnings:[]}
 ]});
 const s=newState(id);const result=await createPaxAgent(s,model).generate({prompt:"Show Delray homes under 600k with 3 beds"});
 expect(result.text).toContain("fictional Delray sample");expect(s.results).toEqual(["delray-courtyard"]);expect(s.preferences.maxPrice).toBe(600000);
});

it("keeps failed notifications for retry and refuses fake AI in production",async()=>{
 vi.stubEnv("PAX_NOTIFICATIONS","email");vi.stubEnv("RESEND_API_KEY","unit-test");vi.stubEnv("RESEND_FROM","pax@example.com");vi.stubEnv("PAX_AGENT_EMAIL","paul@example.com");
 vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("temporary outage")));
 const s=contactState();flagHot(s,"pre-approved");await dispatchQueued(s);
 expect(s.notifications[0].status).toBe("retry");expect(s.notifications[0].attempts).toBe(1);expect(Date.parse(s.notifications[0].nextAttemptAt)).toBeGreaterThan(Date.now());
 vi.stubEnv("PAX_TEST_MODE","1");vi.stubEnv("PAX_STORAGE","local");vi.stubEnv("NODE_ENV","production");
 await expect(streamPax(s,()=>{},new AbortController().signal)).rejects.toThrow("restricted");
 vi.stubEnv("PAX_TEST_MODE","");vi.stubEnv("OPENAI_API_KEY","");
 await expect(streamPax(s,()=>{},new AbortController().signal)).rejects.toThrow("not configured");
});
it("accepts the configured browser origin when Next binds a different local address",async()=>{
 vi.stubEnv("SITE_URL","http://localhost:3000");
 const body=await readBody(new Request("http://0.0.0.0:3000/api/pax/chat",{method:"POST",headers:{origin:"http://localhost:3000","content-type":"application/json"},body:'{"text":"hello"}'}));
 expect(body).toEqual({text:"hello"});
});
