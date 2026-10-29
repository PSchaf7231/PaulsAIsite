import PaxPreview from "@/components/pax-preview";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Meet Pax","A preview of your future Palm Beach County real estate assistant.","/pax");
export default function Pax(){return <div className="container section"><div className="pax-grid"><div><span className="eyebrow">COMING IN PHASE 2</span><h1>Meet Pax.</h1><p className="muted" style={{marginTop:25}}>Your future starting point for questions about homes and your next move. Live AI chat is not connected yet.</p><p className="muted">Browse homes or contact Paul using these shortcuts. Saved-search alerts arrive in Phase 5.</p></div><PaxPreview/></div></div>}
