'use client';
import { createContext,useContext,useEffect,useRef,useState } from 'react';
import type { PageAction } from '@/lib/pax';
import { usePathname,useRouter } from 'next/navigation';
import MadisonBubble from './madison-bubble';
import { communities } from '@/lib/communities';

const PaxContext=createContext<(message?:string)=>void>(()=>{});
export function usePax(){return useContext(PaxContext);}
export function PaxButton({children='Ask Pax',className='btn',message}:{children?:React.ReactNode;className?:string;message?:string}){
 const open=useContext(PaxContext);
 return <button type="button" className={className} onClick={()=>open(message)} aria-haspopup="dialog">{children}</button>;
}
export default function PaxPanel({children}:{children:React.ReactNode}){
 const router=useRouter(),handled=useRef(new Set<string>()),opener=useRef<HTMLElement|null>(null);
 const [request,setRequest]=useState<{id:string;text:string}>();
 const path=usePathname();
 const [open,setOpen]=useState(false),[activation,setActivation]=useState(0);
 const privatePage=/^\/(admin|alerts)(\/|$)/.test(path);
 const listingPath=/^\/listings\/[a-z0-9-]+$/.test(path);
 const area=communities.find(c=>path===`/communities/${c.slug}`)?.name;
 function show(message?:string){setActivation(n=>n+1);opener.current=document.activeElement as HTMLElement;if(message)setRequest({id:crypto.randomUUID(),text:message});setOpen(true);}
 function movePage(action:PageAction){
  if(handled.current.has(action.id)||window.location.pathname!==`/listings/${action.from}`)return;
  if(!['photos','overview','interior','outdoor','practical','location','next'].includes(action.kind))return;
  handled.current.add(action.id);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(window.location.pathname!==`/listings/${action.from}`)return;
   if(action.kind==='next'){if(action.target&&/^[a-z0-9-]{1,240}$/.test(action.target))router.push(`/listings/${action.target}`);return;}
   if(action.kind==='photos'){window.dispatchEvent(new Event('pax-open-photos'));return;}
   const section=document.getElementById(`home-${action.kind}`);if(section instanceof HTMLDetailsElement)section.open=true;
   if(section){section.tabIndex=-1;section.scrollIntoView({block:'start',behavior:'instant'});section.focus({preventScroll:true});}
  }));
 }
 useEffect(()=>{if(new URLSearchParams(window.location.search).get('pax')==='open'){setOpen(true);}},[]);
 return <PaxContext.Provider value={show}>{children}{!privatePage&&<MadisonBubble open={open} activation={activation} onOpen={()=>show()} onClose={()=>{setOpen(false);requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}));}} request={request} listingSlug={listingPath?path.split('/').at(-1):undefined} area={area} onPageAction={movePage}/>}</PaxContext.Provider>;
}
