import Link from 'next/link';
import AdminLogin,{AdminLogout} from '@/components/admin-login';
import { adminConfigured,isAdmin } from '@/server/admin/auth';
import { listSessions } from '@/server/pax/store';
export const dynamic='force-dynamic';
export const metadata={title:'Private lead inbox',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function LeadInbox(){
 if(!await isAdmin())return <AdminLogin configured={adminConfigured()}/>;
 const leads=(await listSessions()).filter(s=>s.lead).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
 return <section className="container section"><AdminLogout/><h1>Your leads</h1><p>Open a lead to review their interests and choose a text to send from your phone.</p>{leads.length?leads.map(s=><article className="text-draft" key={s.id}><Link href={`/admin/leads/${s.id}`}><h2>{s.lead!.name||s.lead!.email||s.lead!.phone}</h2></Link><p>{s.source==='FACEBOOK_FORM'?'Facebook form':'Website'} · {s.preferences.area||'Palm Beach County'} · {s.preferences.timeline||'Timeline not supplied'}</p></article>):<p>No leads yet.</p>}</section>;
}
