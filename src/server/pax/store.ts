import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename, readdir, open, unlink } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";
import type { PaxState } from "../../lib/pax";
import { createPrismaClient } from "../prisma-client";
import { newState, now } from "./state";
export class PaxBusyError extends Error {}
const globalDb=globalThis as unknown as {paxDb?:ReturnType<typeof createPrismaClient>};
function db(){return globalDb.paxDb??=createPrismaClient();}
function local(){
 if(process.env.PAX_STORAGE==="local"){
  if(process.env.NODE_ENV==="production")throw new Error("Local Pax storage is development-only. Use database storage in production.");
  return true;
 }
 return false;
}
function directory(){return path.resolve(/* turbopackIgnore: true */ process.env.PAX_LOCAL_DIRECTORY||".pax-data");}
function file(id:string){if(!/^[a-f0-9]{64}$/.test(id))throw new Error("Invalid conversation identity.");return path.join(directory(),`${id}.json`);}
function json(value:unknown){return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;}
export async function readSession(id:string):Promise<PaxState|null>{
 if(local()){
  try{return JSON.parse(await readFile(/* turbopackIgnore: true */ file(id),"utf8"));}catch(e){if((e as NodeJS.ErrnoException).code==="ENOENT")return null;throw e;}
 }
 const row=await db().paxConversation.findUnique({where:{id}});return row?row.data as unknown as PaxState:null;
}
export async function listSessions():Promise<PaxState[]>{
 if(local()){
  await mkdir(directory(),{recursive:true,mode:0o700});const files=(await readdir(/* turbopackIgnore: true */ directory())).filter(f=>/^[a-f0-9]{64}\.json$/.test(f));
  return Promise.all(files.map(f=>readFile(/* turbopackIgnore: true */ path.join(/* turbopackIgnore: true */ directory(),f),"utf8").then(JSON.parse)));
 }
 const rows=await db().paxConversation.findMany({orderBy:{createdAt:"asc"}});return rows.map(r=>r.data as unknown as PaxState);
}
export async function withSession<T>(id:string,fn:(state:PaxState,checkpoint:()=>Promise<void>)=>Promise<T>|T):Promise<{value:T;state:PaxState}>{
 if(local()){
  await mkdir(directory(),{recursive:true,mode:0o700});const target=file(id),lock=`${target}.lock`;
  let handle;
  try{handle=await open(lock,"wx",0o600);}catch(e){if((e as NodeJS.ErrnoException).code==="EEXIST")throw new PaxBusyError("A reply is already in progress.");throw e;}
  try{
   const state=await readSession(id)||newState(id);
   const checkpoint=async()=>{state.updatedAt=now();const temp=`${target}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(state),{mode:0o600});await rename(temp,target);};
   const value=await fn(state,checkpoint);await checkpoint();
   return {value,state};
  }finally{await handle.close();await unlink(lock);}
 }
 const client=db(),token=randomUUID();
 await client.paxConversation.upsert({where:{id},create:{id,data:json(newState(id))},update:{}});
 const claimed=await client.paxConversation.updateMany({where:{id,OR:[{leaseUntil:null},{leaseUntil:{lt:new Date()}}]},data:{leaseToken:token,leaseUntil:new Date(Date.now()+120000)}});
 if(!claimed.count)throw new PaxBusyError("A reply is already in progress.");
 try{
  const state=(await readSession(id))!;
  const checkpoint=async()=>{const result=await client.paxConversation.updateMany({where:{id,leaseToken:token,leaseUntil:{gt:new Date()}},data:{data:json(state),leaseUntil:new Date(Date.now()+120000)}});if(!result.count)throw new PaxBusyError("Conversation lease expired.");};
  const value=await fn(state,checkpoint);state.updatedAt=now();
  await client.$transaction(async tx=>{
   const saved=await tx.paxConversation.updateMany({where:{id,leaseToken:token,leaseUntil:{gt:new Date()}},data:{data:json(state),leaseToken:null,leaseUntil:null}});
   if(!saved.count)throw new PaxBusyError("Conversation lease expired; please retry.");
   if(state.lead){
    const lead=state.lead;
    await tx.paxLead.upsert({where:{conversationId:id},create:{id:lead.id,conversationId:id,name:lead.name,email:lead.email,phone:lead.phone,source:state.source||"WEBSITE",preferences:json({...state.preferences,wanted:state.wanted}),createdAt:new Date(lead.capturedAt)},update:{name:lead.name,email:lead.email,phone:lead.phone,source:state.source||"WEBSITE",preferences:json({...state.preferences,wanted:state.wanted})}});
    for(const a of state.appointments)await tx.paxAppointment.upsert({where:{id:a.id},create:{...a,leadId:lead.id,createdAt:new Date(a.createdAt),confirmedAt:a.confirmedAt?new Date(a.confirmedAt):null},update:{status:a.status,confirmedAt:a.confirmedAt?new Date(a.confirmedAt):null}});
    for(const s of state.searches)await tx.paxSavedSearch.upsert({where:{id:s.id},create:{id:s.id,leadId:lead.id,preferences:json(s.preferences),status:s.status,createdAt:new Date(s.createdAt)},update:{preferences:json(s.preferences),status:s.status}});
   }
  });
  return {value,state};
 }finally{await client.paxConversation.updateMany({where:{id,leaseToken:token},data:{leaseToken:null,leaseUntil:null}});}
}
export async function closePaxDb(){await globalDb.paxDb?.$disconnect();}
