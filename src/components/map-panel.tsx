"use client";
import {useEffect,useRef,useState} from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listings";
const AreaMap=dynamic(()=>import("./area-listings-map"),{ssr:false,loading:()=> <div className="loading">Loading map…</div>});
const Map = dynamic(()=>import("./listings-map"),{ssr:false,loading:()=> <div className="loading">Loading map…</div>});
export default function MapPanel({listings,selectedSlug,focusRequest,numbered=false,searchFilters}:{listings:Listing[];selectedSlug?:string;focusRequest?:number;numbered?:boolean;searchFilters?:string}){
 const target=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setReady(true);observer.disconnect();}},{rootMargin:'100px'});if(target.current)observer.observe(target.current);return()=>observer.disconnect();},[]);
 return <div ref={target} className={`map-shell${searchFilters!==undefined?" area-map-shell":""}`} aria-label="Listing map">{ready?searchFilters!==undefined?<AreaMap filters={searchFilters}/>:<Map listings={listings.filter(l=>l.latitude!==null&&l.longitude!==null)} selectedSlug={selectedSlug} focusRequest={focusRequest} numbered={numbered}/>:<div className="loading">Map loads after the homes.</div>}</div>}
