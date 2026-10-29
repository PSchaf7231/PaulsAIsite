import PaxChat from "@/components/pax-chat";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Ask Pax","Explore sample homes, save your search, and plan your next move with Paul Schafranick’s assistant Pax.","/pax");
export default function Pax(){return <div className="container section"><div className="page-intro" style={{paddingTop:0}}><span className="eyebrow">A LITTLE LOCAL KNOW-HOW</span><h1>Your next move starts here.</h1><p>Explore with Pax, then connect with Paul when you’re ready. Today’s five properties are fictional samples; real listings and automated alerts come later.</p></div><PaxChat/></div>}
