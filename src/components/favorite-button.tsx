'use client';
import { useEffect,useState } from 'react';
import { track } from '@/lib/activity-client';
export default function FavoriteButton({slug}:{slug:string}){
 const [saved,setSaved]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{function update(e:Event){setSaved(((e as CustomEvent).detail.saved||[]).includes(slug));}window.addEventListener('pax:activity',update);return()=>window.removeEventListener('pax:activity',update);},[slug]);
 return <button className="pax-save" disabled={saved||busy} onClick={async()=>{setBusy(true);try{await track({kind:'favorite',slug});}finally{setBusy(false);}}}>{saved?'Saved':'Save this home'}</button>;
}
