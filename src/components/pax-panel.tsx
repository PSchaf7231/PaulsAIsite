'use client';
import { createContext,useContext,useEffect,useRef,useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import samples from '@/lib/sample-listings.json';
import { communities } from '@/lib/communities';
const PaxChat=dynamic(()=>import('./pax-chat'),{loading:()=> <p role="status">Loading Pax…</p>});
const PaxContext=createContext<()=>void>(()=>{});
export function PaxButton({children='Ask Pax',className='btn'}:{children?:React.ReactNode;className?:string}){
 const open=useContext(PaxContext);
 return <button type="button" className={className} onClick={open} aria-haspopup="dialog">{children}</button>;
}
export default function PaxPanel({children}:{children:React.ReactNode}){
 const path=usePathname(),dialog=useRef<HTMLDialogElement>(null),previousPath=useRef(path);
 const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false);
 const privatePage=/^\/(admin|alerts)(\/|$)/.test(path);
 const listing=path.startsWith('/listings/')?samples.find(l=>path===`/listings/${l.slug}`):undefined;
 const area=communities.find(c=>path===`/communities/${c.slug}`)?.name;
 function show(){setLoaded(true);setOpen(true);}
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('pax')==='open'){setLoaded(true);setOpen(true);}},[]);
 useEffect(()=>{if(previousPath.current!==path){previousPath.current=path;setOpen(false);}},[path]);
 useEffect(()=>{
  const element=dialog.current;if(!element)return;
  if(open&&!privatePage){element.showModal();const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element.close();document.body.style.overflow=prior;};}
  element.close();
 },[open,privatePage]);
 return <PaxContext.Provider value={show}>{children}{!privatePage&&<PaxButton className="btn floating-pax">Ask Pax</PaxButton>}<dialog ref={dialog} className="pax-drawer" aria-labelledby="pax-panel-title" onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientY<r.top||e.clientX>r.right||e.clientY>r.bottom)setOpen(false);}}}><header className="pax-drawer-header"><div><h2 id="pax-panel-title">Ask Pax</h2><p>{listing?`Viewing: ${listing.title}`:area?`Exploring ${area}`:'Your conversation stays with you.'}</p></div><button className="btn outline small" autoFocus onClick={()=>setOpen(false)} aria-label="Close Pax">Close ×</button></header>{loaded&&<PaxChat listingSlug={listing?.slug} initialArea={area}/>}</dialog></PaxContext.Provider>;
}
