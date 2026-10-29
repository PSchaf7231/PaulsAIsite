import Link from 'next/link';
import { searchSummary } from '@/lib/search-summary';
import { notFound } from 'next/navigation';
import AdminLogin,{AdminLogout} from '@/components/admin-login';
import SuggestedTexts from '@/components/suggested-texts';
import { adminConfigured,isAdmin } from '@/server/admin/auth';
import { readSession } from '@/server/pax/store';
import { suggestedTexts } from '@/server/pax/text-suggestions';
export const dynamic='force-dynamic';
export const metadata={title:'Private lead details',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function LeadDetail({params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())return <AdminLogin configured={adminConfigured()}/>;
 const {id}=await params;if(!/^[a-f0-9]{64}$/.test(id))notFound();const s=await readSession(id);if(!s?.lead)notFound();
 return <section className="container section"><Link href="/admin/leads">← All leads</Link><AdminLogout/><h1>{s.lead.name||'Your lead'}</h1><p>{s.source==='FACEBOOK_FORM'?'Facebook form':'Website'}</p><p>{s.lead.phone} · {s.lead.email&&<a href={`mailto:${s.lead.email}`}>{s.lead.email}</a>}</p><h2>What they’re looking for</h2><p>{s.wanted||s.preferences.area||'Not supplied'} · Timeline: {s.preferences.timeline||'Not supplied'}</p><p>Budget: {s.preferences.maxPrice?`up to $${s.preferences.maxPrice.toLocaleString('en-US')}`:'Not supplied'} · Beds: {s.preferences.beds||'Not supplied'}</p><p>Viewed: {s.viewed.join(', ')||'None recorded'}</p><p>Saved: {s.saved.join(', ')||'None recorded'}</p><h2>Confirmed saved search</h2>{s.searches.length?s.searches.map(search=><article className="text-draft" key={search.id}><p>{searchSummary(search.preferences)}</p><p>Notes: {search.preferences.notes||"No additional notes"}</p><p>Alert status: {search.status} · Email permission: {s.communicationConsent?.email?"Yes":"No"}</p></article>):<p>No confirmed search yet.</p>}<h2>Pax’s current notes and draft</h2><p>{searchSummary(s.preferences)}</p><p>{s.preferences.notes||"No additional notes"}</p>{!!s.listingAlerts?.length&&<p>Latest new sample matches: {s.listingAlerts.at(-1)!.slugs.join(", ")}</p>}<SuggestedTexts phone={s.lead.phone} suggestions={suggestedTexts(s)}/></section>;
}
