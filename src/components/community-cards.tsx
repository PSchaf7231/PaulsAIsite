import HomePlacePhoto from './home-place-photo';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { communities } from '@/lib/communities';
import { communityPhotos } from '@/lib/community-photos';
export default function CommunityCards(){return <><div className="community-grid">{communities.map(c=>{const photo=communityPhotos.find(p=>p.city===c.name);return <Link className="community-card" href={`/communities/${c.slug}`} key={c.slug}>{photo&&<HomePlacePhoto src={`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(photo.file)}?width=960`} alt={photo.alt}/>}<h3>{c.name}</h3><span>{c.tag}</span><ArrowUpRight className="arrow" size={16}/></Link>;})}</div><details className="home-photo-credits"><summary>Community photography credits</summary><p>Real photographs taken at different dates. Display crops retain the original licenses.</p><ul>{communityPhotos.filter(p=>communities.some(c=>c.name===p.city)).map(p=><li key={p.city}><a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file)}`}>{p.city} — {p.author}</a> · <a href={p.licenseUrl}>{p.license}</a></li>)}</ul></details></>}
