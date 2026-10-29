"use client";
import { useEffect } from "react";
export default function PaxListingView({slug}:{slug:string}){
 useEffect(()=>{void fetch("/api/pax/session").then(r=>r.json()).then(data=>data.session?fetch("/api/pax/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"view",slug})}):undefined).catch(()=>{});},[slug]);
 return null;
}
