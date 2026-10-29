import Link from "next/link";
import { guides } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Helpful guides","A clearer path from your first question to your next move.","/guides");
export default function Page(){return <div className="container" style={{paddingBottom:80}}><div className="page-intro"><span className="eyebrow">A LITTLE GUIDANCE</span><h1>Helpful guides</h1><p>A clearer path from your first question to your next move.</p></div><div className="article-cards">{guides.map(a=><Link className="article-card" href={`/guides/${a.slug}`} key={a.slug}><span className="eyebrow">{a.category}</span><h2>{a.title}</h2><p>{a.excerpt}</p><span className="textlink">Read more ↗</span></Link>)}</div></div>}
