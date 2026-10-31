'use client';
import { useEffect,useRef,useState } from 'react';
import type { Listing } from '@/lib/listings';
import { PaxButton } from './pax-panel';
import PropertyImage from './property-image';
export function HomeBrief({slug,initial}:{slug:string;initial:string[]}){
 const [summary,setSummary]=useState(initial);
 useEffect(()=>{const controller=new AbortController();async function refresh(){try{const r=await fetch(`/api/pax/home/${encodeURIComponent(slug)}`,{cache:'no-store',signal:controller.signal});if(r.ok){const data=await r.json();setSummary(data.summary);}}catch{}}
 void refresh();window.addEventListener('pax-session-updated',refresh);return()=>{controller.abort();window.removeEventListener('pax-session-updated',refresh);};},[slug]);
 return <section className="home-brief" aria-label="Pax’s home summary"><span className="eyebrow">PAX’S TAKE</span><h2>The things that matter.</h2><ul>{summary.map((point,i)=><li key={i}>{point}</li>)}</ul></section>;
}
export function PropertyGallery({listing}:{listing:Listing}){
 const dialog=useRef<HTMLDialogElement>(null),[index,setIndex]=useState(0),[open,setOpen]=useState(false);
 useEffect(()=>{function show(){if(listing.photos.length){setIndex(0);setOpen(true);}}window.addEventListener('pax-open-photos',show);return()=>window.removeEventListener('pax-open-photos',show);},[listing.photos.length]);
 useEffect(()=>{const d=dialog.current;if(!d)return;if(open){d.showModal();const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{d.close();document.body.style.overflow=prior;};}d.close();},[open]);
 const photo=listing.photos[index];
 return <><div className="gallery" id="home-photos" tabIndex={-1}>{!listing.photos.length&&<p className="notice">Photos have not been supplied. Paul can help request them.</p>}{listing.photos.map((p,i)=><button type="button" key={p.position} className="photo-open" aria-label={`Open photo ${i+1}`} onClick={()=>{setIndex(i);setOpen(true);}}><PropertyImage sample={listing.isSample} src={p.url} alt={p.alt} width={1100} height={740} loading={i===0?'eager':'lazy'}/></button>)}</div>{listing.isSample&&<p className="notice">{listing.attribution}</p>}<dialog ref={dialog} className="property-lightbox" aria-label="Property photos" onCancel={()=>setOpen(false)}><header><strong>Photo {index+1} of {listing.photos.length}</strong><button className="btn outline small" autoFocus onClick={()=>setOpen(false)}>Close photos</button></header>{photo&&<PropertyImage sample={listing.isSample} src={photo.url} alt={photo.alt} width={1400} height={950} loading="eager"/>}<div className="actions"><button className="btn outline" disabled={index===0} onClick={()=>setIndex(i=>i-1)}>Previous photo</button><button className="btn" disabled={index>=listing.photos.length-1} onClick={()=>setIndex(i=>i+1)}>Next photo</button></div>{listing.isSample&&<p className="notice">{listing.attribution}</p>}</dialog></>;
}
export function HomePaxBar(){return <nav className="home-pax-bar" aria-label="Ask Pax about this home"><PaxButton className="btn small">Ask Pax about this home</PaxButton><div className="home-pax-quick">{["What’s nearby","Request a showing","Compare to my saved homes","What would my payment be"].map(text=><PaxButton key={text} className="btn outline small" message={text}>{text}</PaxButton>)}</div></nav>;}
