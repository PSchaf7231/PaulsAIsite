import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { agent, siteUrl } from "@/lib/config";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import "./globals.css";
export const metadata:Metadata={metadataBase:new URL(siteUrl()),title:{default:`${agent.brandName} | ${agent.name}`,template:`%s | ${agent.brandName}`},description:`Explore Palm Beach County homes and communities with ${agent.name}.`,robots:{index:false,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){
 const schema={"@context":"https://schema.org","@type":"RealEstateAgent",name:agent.name,url:siteUrl(),telephone:agent.phone,email:agent.email,areaServed:agent.communities.map(name=>({"@type":"City",name})),...(agent.headshot?{image:agent.headshot}:{}),...(agent.licenseNumber?{identifier:agent.licenseNumber}:{}),sameAs:Object.values(agent.socials)};
 return <html lang="en"><body><a href="#main" className="skip">Skip to content</a><SiteHeader/><main id="main">{children}</main><SiteFooter/><Link className="btn floating-pax" href="/pax"><MessageCircle size={16}/>Ask Pax <span style={{fontSize:9,opacity:.7}}>PREVIEW</span></Link><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\u003c")}}/></body></html>;
}
