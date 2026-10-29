import Link from "next/link";
import { posts } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
export const metadata=pageMetadata("Local perspectives","Thoughtful starting points for life and real estate in Palm Beach County.","/blog");
export default function Page(){return <div className="container" style={{paddingBottom:80}}><div className="page-intro"><span className="eyebrow">A LITTLE GUIDANCE</span><h1>Local perspectives</h1><p>Thoughtful starting points for life and real estate in Palm Beach County.</p></div><div className="article-cards">{posts.map(a=><Link className="article-card" href={`/blog/${a.slug}`} key={a.slug}><span className="eyebrow">{a.category}</span><h2>{a.title}</h2><p>{a.excerpt}</p><span className="textlink">Read more ↗</span></Link>)}</div></div>}
