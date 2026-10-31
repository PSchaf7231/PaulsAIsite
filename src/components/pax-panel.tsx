'use client';
import { createContext,useContext,useEffect,useRef,useState } from 'react';
import type { PageAction } from '@/lib/pax';
import { usePathname,useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Listing } from '@/lib/listings';
import { communities } from '@/lib/communities';
const PaxChat=dynamic(()=>import('./pax-chat'),{loading:()=> <p role="status">Loading Pax…</p>});
const PaxContext=createContext<(message?:string)=>void>(()=>{});
export function usePax(){return useContext(PaxContext);}
export function PaxButton({children='Ask Pax',className='btn',message}:{children?:React.ReactNode;className?:string;message?:string}){
 const open=useContext(PaxContext);
 return <button type="button" className={className} onClick={()=>open(message)} aria-haspopup="dialog">{children}</button>;
}
export default function PaxPanel({children}:{children:React.ReactNode}){
 const router=useRouter(),handled=useRef(new Set<string>());
 const [currentHome,setCurrentHome]=useState<Listing|null>(null);
 const [request,setRequest]=useState<{id:string;text:string}>();
 const path=usePathname(),dialog=useRef<HTMLDialogElement>(null),previousPath=useRef(path);
 const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false);
 const privatePage=/^\/(admin|alerts)(\/|$)/.test(path);
 const listing=currentHome&&path===`/listings/${currentHome.slug}`?currentHome:undefined;
 const listingPath=/^\/listings\/[a-z0-9-]+$/.test(path);
 useEffect(()=>{if(!/^\/listings\/[a-z0-9-]+$/.test(path)){setCurrentHome(null);return;}const controller=new AbortController();fetch(`/api/listings/${path.split('/').at(-1)}`,{signal:controller.signal}).then(async r=>{if(r.ok)setCurrentHome((await r.json()).listing);else setCurrentHome(null);}).catch(()=>{});return()=>controller.abort();},[path]);
 const area=communities.find(c=>path===`/communities/${c.slug}`)?.name;
 function show(message?:string){previousPath.current=window.location.pathname;if(message)setRequest({id:crypto.randomUUID(),text:message});setLoaded(true);setOpen(true);}
 function movePage(action:PageAction){
  if(handled.current.has(action.id)||window.location.pathname!==`/listings/${action.from}`)return;
  if(!['photos','overview','interior','outdoor','practical','location','next'].includes(action.kind))return;
  handled.current.add(action.id);dialog.current?.close();setOpen(false);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(window.location.pathname!==`/listings/${action.from}`)return;
   if(action.kind==='next'){if(action.target&&/^[a-z0-9-]{1,240}$/.test(action.target))router.push(`/listings/${action.target}`);return;}
   if(action.kind==='photos'){window.dispatchEvent(new Event('pax-open-photos'));return;}
   const section=document.getElementById(`home-${action.kind}`);if(section instanceof HTMLDetailsElement)section.open=true;
   if(section){section.tabIndex=-1;section.scrollIntoView({block:'start',behavior:'instant'});section.focus({preventScroll:true});}
  }));
 }
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('pax')==='open'){setLoaded(true);setOpen(true);}},[]);
 useEffect(()=>{if(previousPath.current!==path){previousPath.current=path;setOpen(false);}},[path]);
 useEffect(()=>{
  const element=dialog.current;if(!element)return;
  if(open&&!privatePage){element.showModal();const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element.close();document.body.style.overflow=prior;};}
  element.close();
 },[open,privatePage]);
 return <PaxContext.Provider value={show}>{children}{!privatePage&&!listingPath&&<PaxButton className="btn floating-pax">✦ Pax</PaxButton>}<dialog ref={dialog} className="pax-drawer" aria-labelledby="pax-panel-title" onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientY<r.top||e.clientX>r.right||e.clientY>r.bottom)setOpen(false);}}}><header className="pax-drawer-header"><div><h2 id="pax-panel-title">Ask Pax</h2><p>{listing?`Viewing: ${listing.title}`:area?`Exploring ${area}`:'Your conversation stays with you.'}</p></div><button className="btn outline small" autoFocus onClick={()=>setOpen(false)} aria-label="Close Pax">Close ×</button></header>{loaded&&<PaxChat active={open} listingSlug={listingPath?path.split("/").at(-1):undefined} initialArea={area} request={request} onPageAction={movePage}/>}</dialog></PaxContext.Provider>;
}
