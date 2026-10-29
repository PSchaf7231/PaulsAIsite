import PropertyImage from "@/components/property-image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { communities } from "@/lib/communities";
const photos=["photo-1600596542815-ffad4c1539a9","photo-1600607687920-4e2a09cf159d","photo-1600566753086-00f18fb6b3ea","photo-1600047509807-ba8f99d2cdde"];
export default function CommunityCards(){return <div className="community-grid">{communities.map((c,i)=><Link className="community-card" href={`/communities/${c.slug}`} key={c.slug}><PropertyImage src={`https://images.unsplash.com/${photos[i%photos.length]}?auto=format&fit=crop&w=600&q=75`} alt="" loading="lazy" width={600} height={500}/><h3>{c.name}</h3><span>{c.tag}</span><ArrowUpRight className="arrow" size={16}/></Link>)}</div>}
