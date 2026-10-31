import Link from "next/link";
import { agent } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Meet Paul Schafranick","Connect with Paul Schafranick about buying or selling in Palm Beach County.","/about");
export default function About(){return <div className="container section"><div className="about-text-only"><div className="about-copy"><span className="eyebrow">YOUR NEXT MOVE STARTS WITH A CONVERSATION</span><h1 style={{fontSize:60}}>{agent.name}</h1><p>Whether you’re buying, selling, or exploring, start by sharing what matters to you. We can talk through the kind of home, location, and timing that fit your plans.</p><p>Explore Delray Beach, Boca Raton, Boynton Beach, Lake Worth Beach, West Palm Beach, Jupiter, Wellington, and Palm Beach Gardens.</p><div className="actions"><Link className="btn" href="/contact">Let’s talk ↗</Link><Link className="textlink" href="/communities">Explore communities</Link></div></div></div></div>}
