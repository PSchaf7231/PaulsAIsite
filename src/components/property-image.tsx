'use client';
import Image from 'next/image';
import { useState,type ImgHTMLAttributes } from 'react';
export default function PropertyImage(props:ImgHTMLAttributes<HTMLImageElement>){
 const [failed,setFailed]=useState(false);
 const source=typeof props.src==='string'?props.src:'/images/coastal-home.webp';
 return <Image src={failed?'/images/coastal-home.webp':source} alt={failed?'AI-generated illustrative coastal home; not a photograph of the listed property or community':props.alt||''} width={Number(props.width)||600} height={Number(props.height)||400} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" className={props.className} style={props.style} loading={props.loading||'lazy'} onError={()=>setFailed(true)}/>;
}
