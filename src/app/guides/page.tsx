import { PaxButton } from '@/components/pax-panel';
import Link from "next/link";
import { guides } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Helpful guides","A clearer path from your first question to your next move.","/guides");
export default function Page(){return <div className="container" style={{paddingBottom:80}}><div className="page-intro"><span className="eyebrow">A LITTLE GUIDANCE</span><h1>Helpful guides</h1><p>A clearer path from your first question to your next move.</p></div><div className="article-cards">{guides.map(a=><article className="article-card" key={a.slug}><span className="eyebrow">{a.category}</span><h2>{a.title}</h2><p>{a.excerpt}</p><Link className="textlink" href={`/guides/${a.slug}`}>Read more ↗</Link><PaxButton className="btn outline" message={`Help me understand this guide: ${a.title}. ${a.excerpt}`}>✦ Ask Pax about this</PaxButton></article>)}</div></div>}
