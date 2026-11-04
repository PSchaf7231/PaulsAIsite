'use client';
type MarketingWindow=Window & {gtag?:(...args:unknown[])=>void;fbq?:(...args:unknown[])=>void;clarity?:(...args:unknown[])=>void};
export function analyticsConsent(){try{return localStorage.getItem('pax-analytics')==='yes';}catch{return false;}}
export function marketingEvent(name:'Lead'|'Contact'|'anam_session_start'|'listing_view_count'|'property_shared',eventId?:string){
 if(!analyticsConsent()||/^\/(admin|api|alerts)(\/|$)/.test(location.pathname))return;
 const w=window as MarketingWindow;
 w.gtag?.('event',name==='Lead'?'generate_lead':name==='Contact'?'contact':name);
 if(name==='Lead'||name==='Contact')w.fbq?.('track',name,{},eventId?{eventID:eventId}:{});
 w.clarity?.('event',name);
}
