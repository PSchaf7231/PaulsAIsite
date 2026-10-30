'use client';
import { aiReferral } from '@/lib/ai-referral';
import Script from 'next/script';
import { useEffect,useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
type AnalyticsWindow=Window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;};
const id=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID||'';
export const analyticsPublicPath=(path:string)=>!/^\/(admin|api|alerts)(\/|$)/.test(path);
function reportVital(metric:{name:string;value:number;id:string}){
 const w=window as AnalyticsWindow;
 if(!w.gtag||!analyticsPublicPath(location.pathname)||(window as unknown as Record<string,unknown>)[`ga-disable-${id}`])return;
 w.gtag('event',metric.name,{value:Math.round(metric.name==='CLS'?metric.value*1000:metric.value),metric_id:metric.id,non_interaction:true});
}
export default function SiteAnalytics(){
 const path=usePathname(),[choice,setChoice]=useState<string|null>(null),[ready,setReady]=useState(false);
 const valid=/^G-[A-Z0-9]+$/.test(id),allowed=valid&&choice==='yes'&&analyticsPublicPath(path);
 useReportWebVitals(reportVital);
 useEffect(()=>{try{setChoice(localStorage.getItem('pax-analytics'));}catch{}setReady(true);},[]);
 useEffect(()=>{
  (window as unknown as Record<string,unknown>)[`ga-disable-${id}`]=!allowed;
  if(!allowed)return;
  const w=window as AnalyticsWindow;w.dataLayer??=[];w.gtag??=((...args)=>{w.dataLayer!.push(args);});
  const cleanUrl=location.origin+path;
  const referral=aiReferral(document.referrer,location.search);
  w.gtag('js',new Date());w.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:cleanUrl,page_referrer:document.referrer?new URL(document.referrer).origin:''});w.gtag('event','page_view',{page_location:cleanUrl,page_path:path,page_title:document.title,...(referral?{ai_referral_source:referral}: {})});
 },[path,allowed]);
 function choose(value:string){try{localStorage.setItem('pax-analytics',value);}catch{}setChoice(value);}
 if(!valid||!ready||!analyticsPublicPath(path))return null;
 return <div className="container analytics-choice">{allowed&&<Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/>}{choice===null?<><p>Allow optional site analytics to help improve this site? Your lead details and chat messages are not sent to Google Analytics.</p><button className="btn outline small" onClick={()=>choose('yes')}>Allow site analytics</button> <button className="btn outline small" onClick={()=>choose('no')}>No thanks</button></>:<button className="textlink" onClick={()=>choose(choice==='yes'?'no':'yes')}>{choice==='yes'?'Turn off site analytics':'Allow site analytics'}</button>}</div>;
}
