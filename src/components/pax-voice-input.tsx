'use client';
import { useEffect,useRef,useState } from 'react';
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;abort:()=>void;stop:()=>void};
type SpeechWindow=Window & {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
export default function PaxVoiceInput({disabled,onTranscript}:{disabled:boolean;onTranscript:(text:string)=>void}){
 const [supported,setSupported]=useState<boolean|null>(null),[notice,setNotice]=useState(false),[listening,setListening]=useState(false),[status,setStatus]=useState('');
 const recognition=useRef<Recognition|null>(null);
 useEffect(()=>{const w=window as SpeechWindow;setSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>{if(recognition.current){recognition.current.onresult=null;recognition.current.onend=null;recognition.current.onerror=null;recognition.current.abort();}};},[]);
 useEffect(()=>{if(disabled)recognition.current?.abort();},[disabled]);
 function start(){
  const w=window as SpeechWindow,Speech=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Speech||disabled)return;
  const r=new Speech();recognition.current=r;r.lang='en-US';r.continuous=false;r.interimResults=false;
  r.onresult=event=>{const text=Array.from(event.results).map(result=>result[0]?.transcript||'').join(' ').trim().slice(0,2000);if(text){onTranscript(text);setStatus('Voice draft ready. Review it, then press Send.');}};
  r.onerror=event=>{setListening(false);setStatus(event.error==='not-allowed'?'Microphone permission was not granted. You can keep typing.':'Voice typing could not finish. Try again or type your request.');};
  r.onend=()=>setListening(false);
  try{r.start();setListening(true);setStatus('Listening…');}catch{setListening(false);setStatus('Voice typing is unavailable. You can keep typing.');}
 }
 if(supported===null)return null;
 return <div className="pax-voice"><button type="button" className="textlink" disabled={disabled||!supported} onClick={()=>{if(listening){recognition.current?.stop();return;}setNotice(true);}}>{listening?'Stop listening':'Speak to Pax'}</button>{!supported&&<small> Voice typing isn’t available in this browser.</small>}{notice&&!listening&&<div className="voice-notice"><p>Your browser may send audio to its speech service. We use the transcript as a draft; review it before sending to Pax.</p><button type="button" className="btn outline small" disabled={disabled} onClick={()=>{setNotice(false);start();}}>Start microphone</button> <button type="button" className="textlink" onClick={()=>setNotice(false)}>Cancel</button></div>}{status&&<p role="status">{status}</p>}</div>;
}
