'use client';
let queue:Promise<unknown>=Promise.resolve();
export function track(input:unknown){
 queue=queue.catch(()=>{}).then(async()=>{
  for(let attempt=0;attempt<3;attempt++){
   const response=await fetch('/api/pax/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),keepalive:true});
   if(response.status===409){await new Promise(r=>setTimeout(r,300*(attempt+1)));continue;}
   if(!response.ok)return;
   const result=await response.json();window.dispatchEvent(new CustomEvent('pax:activity',{detail:result}));return result;
  }
 }).catch(()=>undefined);return queue;
}

export async function activityReady(){await queue;}
