'use client';
import { useState } from 'react';
import { usePax } from './pax-panel';
export default function PaxEntry({title,placeholder,chips=[],initial=''}:{title:string;placeholder:string;chips?:string[];initial?:string}){
 const [value,setValue]=useState(initial);const open=usePax();
 return <section className="pax-entry data-panel" aria-label={title}><div className="pax-entry-title"><span aria-hidden="true">✦</span><h2>{title}</h2></div><form onSubmit={e=>{e.preventDefault();if(value.trim())open(value.trim());}}><label><span className="sr-only">{title}</span><input value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} maxLength={2000} required/></label><button className="btn" type="submit">Ask Pax ↗</button></form>{chips.length>0&&<div className="pax-entry-chips">{chips.map(text=><button key={text} onClick={()=>open(text)}>{text}</button>)}</div>}</section>;
}
