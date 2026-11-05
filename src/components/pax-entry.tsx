'use client';
import {useRouter} from 'next/navigation';
import { useState } from 'react';
import { usePax } from './pax-panel';
export default function PaxEntry({title,placeholder,chips=[],initial='',search=false}:{title:string;placeholder:string;chips?:string[];initial?:string;search?:boolean}){
 const [value,setValue]=useState(initial);const open=usePax(),router=useRouter();
 function submit(text:string){if(search)router.push(`/listings?${new URLSearchParams({q:text})}`);else open(text);}
 return <section className="pax-entry data-panel" aria-label={title}><div className="pax-entry-title"><span aria-hidden="true">✦</span><h2>{title}</h2></div><form onSubmit={e=>{e.preventDefault();if(value.trim())submit(value.trim());}}><label><span className="sr-only">{title}</span><input value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} maxLength={2000} required/></label><button className="btn" type="submit">Ask Madison ↗</button></form>{chips.length>0&&<div className="pax-entry-chips">{chips.map(text=><button key={text} onClick={()=>submit(text)}>{text}</button>)}</div>}</section>;
}
