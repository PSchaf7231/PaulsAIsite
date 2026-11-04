'use client';
import {metaPixelId} from '@/lib/marketing-config';
import {marketingEvent} from '@/lib/marketing-events';
import { aiReferral } from '@/lib/ai-referral';
import Script from 'next/script';
import { useEffect,useRef,useState } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
type AnalyticsWindow=Window & {dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;};
const pixel=metaPixelId,clarity=process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID??'z8lkd7mqv0';
const pixelValid=/^\d+$/.test(pixel),clarityValid=/^[a-z0-9]+$/i.test(clarity);
const id=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID||'';
export const analyticsPublicPath=(path:string)=>!/^\/(admin|api|alerts)(\/|$)/.test(path);
function reportVital(metric:{name:string;value:number;id:string}){
 const w=window as AnalyticsWindow;
 if(!w.gtag||!analyticsPublicPath(location.pathname)||(window as unknown as Record<string,unknown>)[`ga-disable-${id}`])return;
 w.gtag('event',metric.name,{value:Math.round(metric.name==='CLS'?metric.value*1000:metric.value),metric_id:metric.id,non_interaction:true});
}
export default function SiteAnalytics(){
 const path=usePathname(),[choice,setChoice]=useState<string|null>(null),[ready,setReady]=useState(false);
 const previousPath=useRef(path);
 const valid=/^G-[A-Z0-9]+$/.test(id),allowed=(valid||pixelValid||clarityValid)&&choice==='yes'&&analyticsPublicPath(path);
 useReportWebVitals(reportVital);
 useEffect(()=>{
  if(previousPath.current===path)return;
  previousPath.current=path;
  if(analyticsPublicPath(path))(window as Window & {widgetTracker?:(...args:unknown[])=>void}).widgetTracker?.('send','pageview');
 },[path]);
 useEffect(()=>{try{setChoice(localStorage.getItem('pax-analytics'));}catch{}setReady(true);},[]);
 useEffect(()=>{
  (window as unknown as Record<string,unknown>)[`ga-disable-${id}`]=!allowed;
  if(!allowed)return;
  const w=window as AnalyticsWindow;w.dataLayer??=[];w.gtag??=((...args)=>{w.dataLayer!.push(args);});
  const cleanUrl=location.origin+path;
  const referral=aiReferral(document.referrer,location.search);
  if(!valid)return;
  w.gtag('js',new Date());w.gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:cleanUrl,page_referrer:document.referrer?new URL(document.referrer).origin:''});w.gtag('event','page_view',{page_location:cleanUrl,page_path:path,page_title:document.title,...(referral?{ai_referral_source:referral}: {})});
 },[path,allowed]);
 useEffect(()=>{
  if(!allowed)return;
  function click(event:MouseEvent){if(event.target instanceof Element&&event.target.closest('a[href^="tel:"]'))marketingEvent('Contact');}
  document.addEventListener('click',click);return()=>document.removeEventListener('click',click);
 },[allowed]);
 useEffect(()=>{if(allowed&&pixelValid)(window as Window & {fbq?:(...args:unknown[])=>void}).fbq?.('track','PageView');},[path,allowed]);
 function choose(value:string){try{localStorage.setItem('pax-analytics',value);}catch{}setChoice(value);if(value==='no')window.location.reload();}
 if(!(valid||pixelValid||clarityValid)||!ready||!analyticsPublicPath(path))return null;
 return <div className="container analytics-choice">{allowed&&pixelValid&&<Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}</Script>}{allowed&&clarityValid&&<Script id="clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${clarity}");`}</Script>}{allowed&&valid&&<Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/>}{choice===null?<><p>Allow optional site analytics to help improve this site? Includes Google Analytics, Meta and Microsoft Clarity. Contact details are excluded from browser conversion events.</p><button className="btn outline small" onClick={()=>choose('yes')}>Allow site analytics</button> <button className="btn outline small" onClick={()=>choose('no')}>No thanks</button></>:<button className="textlink" onClick={()=>choose(choice==='yes'?'no':'yes')}>{choice==='yes'?'Turn off site analytics':'Allow site analytics'}</button>}</div>;
}
