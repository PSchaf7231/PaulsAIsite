import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('Photo credits','Sources and licenses for community photography.','/photo-credits',{noindex:true});
import {communityPhotos} from '@/lib/community-photos';
export default function PhotoCredits(){return <div className="container section"><h1>Photo credits</h1><p>Town photographs depict places at the time taken. Display crops retain the original licenses.</p><ul>{communityPhotos.map(p=><li key={p.city}><a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file)}`}>{p.city} — {p.author}</a> · <a href={p.licenseUrl}>{p.license}</a></li>)}</ul></div>}
