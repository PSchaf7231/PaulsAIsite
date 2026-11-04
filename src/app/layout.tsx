import { sparkConfigured } from "@/server/listings/spark";
import { agentSchema,indexingEnabled,jsonLd } from "@/lib/seo";
import SiteAnalytics from "@/components/site-analytics";
import Script from 'next/script';
import type { Metadata } from "next";
import PaxPanel from "@/components/pax-panel";
import { agent, siteUrl } from "@/lib/config";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";
import "./digital.css";
import LeadConversion from "@/components/lead-conversion";
export const metadata:Metadata={metadataBase:new URL(siteUrl()),title:{default:`${agent.brandName} | ${agent.name}`,template:`%s | ${agent.brandName}`},description:`Explore Palm Beach County homes and communities with ${agent.name}.`,robots:{index:indexingEnabled(),follow:true},verification:{google:process.env.GOOGLE_SITE_VERIFICATION||"WmJbOZrkJbwpeyxAJ1WWFZc_rg7oRxS4g6zV5ywWaPs"}};
export default function RootLayout({children}:{children:React.ReactNode}){
 const schema=agentSchema();
 return <html lang="en"><head><link rel="preload" as="image" href="/images/team/3-madison.webp"/><Script id="follow-up-boss" strategy="beforeInteractive">{`(function(w,i,d,g,e,t){w["WidgetTrackerObject"]=g;(w[g]=w[g]||function(){(w[g].q=w[g].q||[]).push(arguments);}),(w[g].ds=1*new Date());(e="script"),(t=d.createElement(e)),(e=d.getElementsByTagName(e)[0]);t.async=1;t.src=i;e.parentNode.insertBefore(t,e);})(window,"https://widgetbe.com/agent",document,"widgetTracker");window.widgetTracker("create","WT-OGUKSOSV");window.widgetTracker("send","pageview");`}</Script></head><body><div className="site-ai-atmosphere" aria-hidden="true"/><PaxPanel><a href="#main" className="skip">Skip to content</a><SiteHeader/><main id="main">{children}</main><LeadConversion live={sparkConfigured()}/><SiteFooter live={sparkConfigured()}/><SiteAnalytics/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></PaxPanel></body></html>;
}
