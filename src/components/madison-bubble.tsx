'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type {AnamClient} from '@anam-ai/js-sdk';
import type {PageAction} from '@/lib/pax';
const PaxChat=dynamic(()=>import('./pax-chat'),{loading:()=> <p role="status">Loading your conversation…</p>});
type Props={open:boolean;activation:number;onOpen:()=>void;onClose:()=>void;request?:{id:string;text:string};listingSlug?:string;area?:string;onPageAction:(action:PageAction)=>void};
export default function MadisonBubble({open,activation,onOpen,onClose,request,listingSlug,area,onPageAction}:Props){
 const [loaded,setLoaded]=useState(false),[minimized,setMinimized]=useState(false),[consent,setConsent]=useState(false),[status,setStatus]=useState<'idle'|'connecting'|'connected'>('idle'),[error,setError]=useState(''),[muted,setMuted]=useState(false),[voiceRequest,setVoiceRequest]=useState<{id:string;text:string}>(),[position,setPosition]=useState<{x:number;y:number}|null>(null);
 const client=useRef<AnamClient|null>(null),video=useRef<HTMLVideoElement>(null),panel=useRef<HTMLElement>(null),generation=useRef(0),minimizedRef=useRef(false),seen=useRef(new Set<string>()),sessionTimer=useRef<ReturnType<typeof setTimeout>|null>(null),tokenRequest=useRef<AbortController|null>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 const stop=useCallback(()=>{generation.current++;tokenRequest.current?.abort();if(sessionTimer.current)clearTimeout(sessionTimer.current);const current=client.current;client.current=null;if(current)void current.stopStreaming().catch(()=>{});if(video.current)video.current.srcObject=null;setStatus('idle');setMuted(false);},[]);
 useEffect(()=>()=>stop(),[stop]);
 useEffect(()=>{if(open){setLoaded(true);minimizedRef.current=false;setMinimized(false);panel.current?.focus({preventScroll:true});}},[open,request,activation]);
 useEffect(()=>{function fit(){setPosition(p=>p?{x:Math.max(8,Math.min(p.x,innerWidth-Math.min(380,innerWidth-24)-8)),y:Math.max(8,Math.min(p.y,innerHeight-Math.min(660,innerHeight-24)-8))}:null);}window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[]);
 function move(x:number,y:number){const r=panel.current?.getBoundingClientRect();setPosition({x:Math.max(8,Math.min(x,innerWidth-(r?.width||80)-8)),y:Math.max(8,Math.min(y,innerHeight-(r?.height||80)-8))});}
 function minimize(){minimizedRef.current=true;client.current?.muteInputAudio();client.current?.interruptPersona();setMuted(true);setMinimized(true);}
 function expand(){minimizedRef.current=false;setMinimized(false);setPosition(p=>p?{x:Math.max(8,Math.min(p.x,innerWidth-Math.min(380,innerWidth-24)-8)),y:Math.max(8,Math.min(p.y,innerHeight-Math.min(660,innerHeight-24)-8))}:null);}
 async function start(){
  if(!consent||status!=='idle')return;setError('');setStatus('connecting');const attempt=++generation.current;
  try{
   tokenRequest.current=new AbortController();
   const response=await fetch('/api/pax/avatar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true}),signal:tokenRequest.current.signal});
   const body=await response.json();if(!response.ok)throw new Error(body.error||'Madison could not connect.');
   const {createClient,AnamEvent}=await import('@anam-ai/js-sdk');if(attempt!==generation.current)return;
   const avatar=createClient(body.sessionToken,{metrics:{disableClientMetrics:true}});client.current=avatar;seen.current.clear();
   avatar.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED,messages=>{
    if(attempt!==generation.current)return;const latest=messages.at(-1);
    if(latest?.role==='user'&&latest.content.trim()&&!seen.current.has(latest.id)){seen.current.add(latest.id);setVoiceRequest({id:latest.id,text:latest.content});}
   });
   avatar.addListener(AnamEvent.USER_SPEECH_STARTED,()=>{if(attempt===generation.current)avatar.interruptPersona();});
   avatar.addListener(AnamEvent.CONNECTION_CLOSED,()=>{if(attempt===generation.current){stop();setError('Video ended. Your conversation is saved; you can keep typing.');}});
   avatar.addListener(AnamEvent.MIC_PERMISSION_DENIED,()=>{if(attempt===generation.current){stop();setError('Microphone access was not allowed. You can still type to Pax.');}});
   await avatar.streamToVideoElement('madison-live-video');
   if(attempt!==generation.current){await avatar.stopStreaming();return;}
   setStatus('connected');if(minimizedRef.current)avatar.muteInputAudio();setMuted(minimizedRef.current);sessionTimer.current=setTimeout(()=>{stop();setError('Video session ended after five minutes. Your conversation stays here.');},300000);
  }catch(e){if(attempt!==generation.current)return;stop();setError(e instanceof Error?e.message:'Video is unavailable. You can still type to Pax.');}
 }
 const speak=useCallback((text:string)=>{const current=client.current;if(!current?.isStreaming())return;void current.talk(text).catch(()=>setError('Audio could not play. You can read the reply below.'));},[]);
 return <>
  {!open&&<button className="floating-pax madison-launch" onClick={onOpen} aria-haspopup="dialog" aria-label="Talk to Madison — powered by Pax"><img src="/images/team/3-madison.png" alt="" width={48} height={48}/><span>✦ Pax</span></button>}
  <aside ref={panel} tabIndex={-1} hidden={!open} className={`madison-panel ${minimized?'is-minimized':''}`} style={position?{left:position.x,top:position.y,right:'auto',bottom:'auto'}:undefined} role="dialog" aria-label="Ask Pax" aria-modal="false" onKeyDown={e=>{if(e.key==='Escape'){stop();onClose();}}}>
   <header className="madison-header">
    <button className="madison-drag" aria-label="Move Madison window" title="Drag to move, or use arrow keys" onPointerDown={e=>{if((e.target as HTMLElement).closest('button')!==e.currentTarget)return;const r=panel.current!.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,left:r.left,top:r.top};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)move(drag.current.left+e.clientX-drag.current.x,drag.current.top+e.clientY-drag.current.y);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{const steps:Record<string,[number,number]>={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const step=steps[e.key];if(step){e.preventDefault();const r=panel.current!.getBoundingClientRect();move(r.left+step[0],r.top+step[1]);}}}>⠿ <span><strong>Madison</strong><small>AI assistant · powered by Pax</small></span></button>
    <button aria-label="Minimize Madison" onClick={minimize}>−</button><button aria-label="Close Pax" onClick={()=>{stop();onClose();}}>×</button>
   </header>
   <div className={`madison-video ${status==='connected'?'is-live':''}`}>
    <video ref={video} id="madison-live-video" autoPlay playsInline muted={minimized||muted} aria-label="Madison live video"/>
    {status!=='connected'&&<div className="madison-video-idle"><img src="/images/team/3-madison.png" alt="Madison"/><span>{status==='connecting'?'Connecting…':'Talk to Madison'}</span></div>}
    {minimized&&<button className="madison-restore" onClick={expand} aria-label="Restore Madison conversation">✦<span className="sr-only">Microphone paused</span></button>}
   </div>
   <div className="madison-body" hidden={minimized}>
    {status==='idle'?<div className="madison-start"><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Allow Anam to process my voice and save this chat with my property interests. <Link href="/privacy">Privacy</Link></label><button className="btn small" disabled={!consent} onClick={()=>void start()}>Start video chat</button><span>Or type below. No microphone needed.</span></div>:<div className="madison-video-controls"><button className="btn small outline" disabled={status!=='connected'} onClick={()=>{if(muted)client.current?.unmuteInputAudio();else client.current?.muteInputAudio();setMuted(!muted);}}>{muted?'Unmute microphone':'Mute microphone'}</button><button className="btn small outline" onClick={stop}>End video</button></div>}
    {error&&<p role="alert" className="pax-error">{error}</p>}
    {loaded&&<PaxChat compact active={open&&!minimized} initialArea={area} listingSlug={listingSlug} request={request} voiceRequest={voiceRequest} voiceConsent={consent} onReply={speak} onPageAction={onPageAction}/>}
   </div>
  </aside>
 </>;
}
