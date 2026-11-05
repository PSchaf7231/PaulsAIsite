'use client';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {PageAction} from '@/lib/pax';

type Props={open:boolean;activation:number;onOpen:()=>void;onClose:()=>void;request?:{id:string;text:string};listingSlug?:string;area?:string;onPageAction:(action:PageAction)=>void};

const embed=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#091725}anam-agent{display:block;width:100%;height:100%;--anam-sheet-height:100%;}</style></head><body><anam-agent layout="inline" agent-name="Madison" call-to-action="Start call" ui-text-input="false" ui-transcript="false" ui-captions="false" agent-id="cdb09e97-23af-4628-9df7-f8a270fb8265" api-base-url="https://lab.anam.ai"></anam-agent><script src="https://unpkg.com/@anam-ai/agent-widget" async><\/script></body></html>`;

export default function MadisonBubble({open,activation,onOpen,onClose}:Props){
 const home=usePathname()==='/';
 const [heroTop,setHeroTop]=useState(144);
 useEffect(()=>{function measure(){const hero=document.querySelector('.coastal-hero');if(hero)setHeroTop(hero.getBoundingClientRect().top+window.scrollY+16);}measure();window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);},[home]);
 const [dismissed,setDismissed]=useState(false);
 const [position,setPosition]=useState<{x:number;y:number}|null>(null);
 const panel=useRef<HTMLElement>(null),drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 useEffect(()=>{if(open){setDismissed(false);panel.current?.focus({preventScroll:true});}},[open,activation]);
 useEffect(()=>{function fit(){setPosition(p=>p?{x:Math.max(8,Math.min(p.x,innerWidth-(panel.current?.offsetWidth||220)-8)),y:Math.max(8,Math.min(p.y,innerHeight-(panel.current?.offsetHeight||160)-8))}:null);}window.addEventListener('resize',fit);return()=>window.removeEventListener('resize',fit);},[]);
 function move(x:number,y:number){const r=panel.current?.getBoundingClientRect();setPosition({x:Math.max(8,Math.min(x,innerWidth-(r?.width||220)-8)),y:Math.max(8,Math.min(y,innerHeight-(r?.height||160)-8))});}
 return <>
  {dismissed&&<button className={`floating-pax madison-launch ${home&&!position?'madison-hero-card':''}`} style={{'--madison-hero-top':`${heroTop}px`} as CSSProperties} onClick={()=>{setDismissed(false);onOpen();}} aria-haspopup="dialog" aria-label="Talk to Madison"><img src="/images/team/3-madison.webp" alt="" width={48} height={48}/><span>Talk to Madison</span></button>}
  <aside ref={panel} tabIndex={-1} hidden={dismissed} className={`madison-panel madison-embed-panel ${home&&!position?'madison-hero-card':''}`} style={{'--madison-hero-top':`${heroTop}px`,...(position?{left:position.x,top:position.y,right:'auto',bottom:'auto'}:{})} as CSSProperties} role="dialog" aria-label="Talk to Madison" aria-modal="false" onKeyDown={e=>{if(e.key==='Escape'){setDismissed(true);onClose();}}}>
   <header className="madison-header madison-embed-handle">
    <button className="madison-drag" aria-label="Move Madison window" title="Drag to move" onPointerDown={e=>{const r=panel.current!.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,left:r.left,top:r.top};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)move(drag.current.left+e.clientX-drag.current.x,drag.current.top+e.clientY-drag.current.y);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{const steps:Record<string,[number,number]>={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]};const step=steps[e.key];if(step){e.preventDefault();const r=panel.current!.getBoundingClientRect();move(r.left+step[0],r.top+step[1]);}}}>⠿ <span>Madison · Drag</span></button>
    <button className="madison-embed-close" aria-label="Close Madison" onClick={()=>{setDismissed(true);onClose();}}>×</button>
   </header>
   {!open&&<button className="madison-card-start" onClick={onOpen} aria-label="Talk to Madison"><img src="/images/team/3-madison.webp" alt="" width={200} height={140}/><span>Talk to Madison</span></button>}
   {open&&<iframe className="madison-embed" title="Madison conversation" allow="microphone; autoplay" srcDoc={embed}/>}
  </aside>
 </>;
}
