"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
export default function PropertyImage(props:ImgHTMLAttributes<HTMLImageElement>){
 const [failed,setFailed]=useState(false);
 const imageRef=useRef<HTMLImageElement>(null);
 useEffect(()=>{
  // A server-rendered image can fail before hydration attaches onError.
  const element=imageRef.current;
  if(element?.complete && element.naturalWidth===0) setFailed(true);
 },[]);
 if (failed) return <Image src="/images/coastal-home.png" alt="AI-generated illustrative coastal home; not a photograph of the listed property or community" width={Number(props.width)||600} height={Number(props.height)||400} sizes="(max-width: 760px) 100vw, 50vw" className={props.className} style={props.style} loading={props.loading}/>;
 return <img {...props} ref={imageRef} onError={()=>setFailed(true)}/>;
}
