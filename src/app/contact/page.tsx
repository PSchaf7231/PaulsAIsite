import LeadForm from '@/components/lead-form';
import { agent } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Contact Paul Schafranick","Call or email Paul Schafranick to discuss your next move in Palm Beach County.","/contact");
export default function Contact(){return <div className="container section"><div className="contact-simple"><span className="eyebrow">LET’S MAKE YOUR NEXT MOVE CLEARER</span><h1>It starts with<br/>a conversation.</h1><p className="muted">Buying, selling, or just getting a feel for the market? Call or email Paul directly. Or send your request below.</p><div className="contact-direct"><a href={`tel:${agent.phone.replace(/[^+0-9]/g,"")}`}><span aria-hidden="true">☎</span>{agent.phone}</a><a href={`mailto:${agent.email}`}><span aria-hidden="true">✉</span>{agent.email}</a></div></div><LeadForm/></div>}
