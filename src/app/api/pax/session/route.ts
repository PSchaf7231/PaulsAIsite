import { setFeedMode } from "@/lib/pax-inventory";
import { sparkConfigured } from "@/server/listings/spark";
import { identity,routeError } from "@/server/pax/security";
import { readSession } from "@/server/pax/store";
import { publicPaxState } from "@/lib/pax";
export async function GET(){try{
 const id=await identity();const state=id?await readSession(id):null;if(state)setFeedMode(state,sparkConfigured()?"live":"sample");
 return Response.json({liveFeed:sparkConfigured(),automaticTexts:process.env.PAX_SMS_MODE==="twilio",session:state?publicPaxState(state):null,configured:!!process.env.OPENAI_API_KEY||process.env.PAX_TEST_MODE==="1",localStorage:process.env.PAX_STORAGE==="local",testMode:process.env.PAX_TEST_MODE==="1"},{headers:{"Cache-Control":"no-store"}});
}catch(error){return routeError(error);}}
