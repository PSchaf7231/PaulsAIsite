'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Home, MapPin, Pause, Play, Sparkles } from 'lucide-react';
const steps=[
 {title:'Ask in plain English',description:'Your wish list becomes a place to start.',buyer:'3-bed with a pool in Delray under $800k',reply:'Found 7 — here are the best.'},
 {title:'Pax opens homes for you',description:'Go from a conversation to the details.',buyer:'Let’s look at the first one.',reply:'Opening 123 Ocean Ave…'},
 {title:'Pax remembers what you like',description:'Keep the details that matter to you.',buyer:'Save this one. Loved the kitchen, worried about HOA.',reply:'Noted. Let’s keep that in mind as we compare.'},
 {title:'Talk to Paul when ready',description:'A personal next step, on your terms.',buyer:'I’d like to see 123 Ocean Ave.',reply:'Want Paul to help arrange a showing? What name should he use?'}
];
export default function HowPaxWorks(){
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(false);
 const root=useRef<HTMLElement>(null);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.2});if(root.current)observer.observe(root.current);return()=>{media.removeEventListener('change',update);observer.disconnect();};},[]);
 useEffect(()=>{if(paused||reduced||!visible)return;const timer=setInterval(()=>{if(document.visibilityState==='visible')setActive(i=>(i+1)%steps.length);},6000);return()=>clearInterval(timer);},[paused,reduced,visible]);
 function select(index:number){setActive(index);setPaused(true);}
 return <section ref={root} className={`pax-how container ${paused||reduced?'demo-still':''}`} aria-labelledby="how-pax-title">
  <div className="pax-how-heading"><div><span className="eyebrow">LESS SEARCHING. MORE DISCOVERING.</span><h2 id="how-pax-title">How Pax works.</h2></div><button className="demo-toggle" onClick={()=>setPaused(p=>!p)} disabled={reduced} aria-label={paused?'Play examples':'Pause examples'}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>} {reduced?'Motion reduced':paused?'Play':'Pause'}</button></div>
  <div className="pax-how-grid"><div role="tablist" aria-label="How Pax works" aria-orientation="vertical">{steps.map((step,i)=><button key={step.title} id={`pax-demo-tab-${i}`} role="tab" aria-selected={active===i} aria-controls="pax-demo-panel" tabIndex={active===i?0:-1} onFocus={()=>setPaused(true)} onClick={()=>select(i)} onKeyDown={e=>{let next=i;if(e.key==='ArrowDown')next=(i+1)%4;else if(e.key==='ArrowUp')next=(i+3)%4;else if(e.key==='Home')next=0;else if(e.key==='End')next=3;else return;e.preventDefault();select(next);document.getElementById(`pax-demo-tab-${next}`)?.focus();}}><span className="demo-number">0{i+1}</span><span><strong>{step.title}</strong><small>{step.description}</small></span><span aria-hidden="true">↗</span></button>)}</div>
  <div id="pax-demo-panel" role="tabpanel" aria-labelledby={`pax-demo-tab-${active}`} className="pax-demo-panel"><div className="demo-label"><span><Sparkles size={15}/> PAX / A LOOK INSIDE</span><span>ILLUSTRATIVE EXAMPLE</span></div>
   <div key={active} className="demo-scene"><p className="demo-bubble buyer">{steps[active].buyer}</p><p className="demo-bubble reply"><span>✦ Pax</span>{steps[active].reply}</p>
   {active===0&&<div className="demo-result demo-mini-grid">{['Poolside retreat','Coastal courtyard'].map((name,i)=><div className="demo-home" key={name}><div className="demo-house-art"><Home size={26}/></div><strong>{name}</strong><small>3 beds · Private pool</small></div>)}<div className="demo-map" aria-label="Illustrative map"><MapPin size={24}/><span>Delray Beach</span></div></div>}
   {active===1&&<div className="demo-result demo-property"><div className="demo-house-art"><Home size={40}/></div><div><small>PROPERTY PREVIEW</small><h3>123 Ocean Ave</h3><p>Photos · Details · Location</p><span className="demo-property-line"/><span className="demo-property-line short"/></div></div>}
   {active===2&&<div className="demo-result demo-saved"><span>♡ SAVED HOME</span><h3>123 Ocean Ave</h3><p>“Loved the kitchen, worried about HOA.”</p><small>Your preferences, kept with the conversation.</small></div>}
   {active===3&&<div className="demo-result"><p className="demo-bubble buyer">Alex. Call me at (561) 555-0142.</p><p className="demo-bubble reply">I’ll include 123 Ocean Ave in your request. Please confirm below.</p><div className="demo-confirm"><Check size={20}/><div><strong>Example: request confirmed → Paul notified</strong><small>About 123 Ocean Ave · Showing time still needs confirmation.</small></div></div></div>}
   </div><p className="demo-disclaimer">Fictional homes and conversation. This demonstration does not search, save information, or notify Paul.</p>
  </div></div>
 </section>;
}
