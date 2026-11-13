'use client';
import Image from 'next/image';
import { useEffect,useRef,useState,type ImgHTMLAttributes } from 'react';
export default function PropertyImage(props:ImgHTMLAttributes<HTMLImageElement>&{sample?:boolean}){
 const [failed,setFailed]=useState(false);
 const img=useRef<HTMLImageElement>(null);
 const fallback=props.sample===false?'/images/home-placeholder.svg':'/images/coastal-home.webp';
 const source=typeof props.src==='string'&&props.src?props.src:fallback;
 // A photo that failed before the page became interactive never fires onError; check it once after load.
 useEffect(()=>{const el=img.current;if(el&&el.complete&&el.naturalWidth===0&&el.currentSrc)setFailed(true);},[]);
 return <Image ref={img} src={failed?fallback:source} unoptimized={failed} alt={failed?(props.sample===false?'Photo unavailable for this listing':'AI-generated illustrative coastal home; not a photograph of the listed property or community'):props.alt||''} width={Number(props.width)||600} height={Number(props.height)||400} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" className={props.className} style={props.style} loading={props.loading||'lazy'} onError={()=>{if(!failed)setFailed(true);}}/>;
}
