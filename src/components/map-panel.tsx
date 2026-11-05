"use client";
import {useEffect,useRef,useState} from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listings";
const Map = dynamic(()=>import("./listings-map"),{ssr:false,loading:()=> <div className="loading">Loading map…</div>});
export default function MapPanel({listings,selectedSlug,focusRequest,numbered=false}:{listings:Listing[];selectedSlug?:string;focusRequest?:number;numbered?:boolean}){
 const target=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setReady(true);observer.disconnect();}},{rootMargin:'100px'});if(target.current)observer.observe(target.current);return()=>observer.disconnect();},[]);
 return <div ref={target} className="map-shell" aria-label="Listing map">{ready?<Map listings={listings.filter(l=>l.latitude!==null&&l.longitude!==null)} selectedSlug={selectedSlug} focusRequest={focusRequest} numbered={numbered}/>:<div className="loading">Map loads after the homes.</div>}</div>}
