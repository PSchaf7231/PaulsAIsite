'use client';
import { useEffect, useState } from 'react';
export default function MotionControl(){
 const [paused,setPaused]=useState(false);
 useEffect(()=>{try{setPaused(localStorage.getItem('pax-visual-motion')==='paused');}catch{}},[]);
 useEffect(()=>{document.documentElement.dataset.visualMotion=paused?'paused':'playing';},[paused]);
 return <button className="motion-control" aria-pressed={paused} onClick={()=>{const next=!paused;setPaused(next);try{localStorage.setItem('pax-visual-motion',next?'paused':'playing');}catch{}}}>{paused?'Resume visual effects':'Pause visual effects'}</button>;
}
