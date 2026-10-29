import { agentSchema,indexingEnabled,jsonLd } from "@/lib/seo";
import SiteAnalytics from "@/components/site-analytics";
import type { Metadata } from "next";
import PaxPanel from "@/components/pax-panel";
import { agent, siteUrl } from "@/lib/config";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";
import LeadConversion from "@/components/lead-conversion";
export const metadata:Metadata={metadataBase:new URL(siteUrl()),title:{default:`${agent.brandName} | ${agent.name}`,template:`%s | ${agent.brandName}`},description:`Explore Palm Beach County homes and communities with ${agent.name}.`,robots:{index:indexingEnabled(),follow:true},verification:{google:process.env.GOOGLE_SITE_VERIFICATION||undefined}};
export default function RootLayout({children}:{children:React.ReactNode}){
 const schema=agentSchema();
 return <html lang="en"><body><PaxPanel><a href="#main" className="skip">Skip to content</a><SiteHeader/><main id="main">{children}</main><LeadConversion automaticTexts={process.env.PAX_SMS_MODE==="twilio"}/><SiteFooter/><SiteAnalytics/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></PaxPanel></body></html>;
}
