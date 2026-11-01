import Link from 'next/link';
import {ArrowUpRight} from 'lucide-react';
import {communities} from '@/lib/communities';
export default function CommunityCards(){return <div className="community-grid community-grid-text">{communities.map(c=><Link className="community-card community-card-text" href={`/communities/${c.slug}`} key={c.slug}><h3>{c.name}</h3><span>{c.tag}</span><ArrowUpRight className="arrow" size={16}/></Link>)}</div>}
