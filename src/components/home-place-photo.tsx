'use client';
import {useState} from 'react';
export default function HomePlacePhoto({src,alt}:{src:string;alt:string}){const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);return failed?null:<img className="home-place-photo" style={{opacity:loaded?1:0}} onLoad={()=>setLoaded(true)} src={src} alt={alt} width={960} height={640} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>;}
