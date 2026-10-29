import Unsubscribe from '@/components/unsubscribe';
export const metadata={title:'Stop saved-search alerts',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default async function Page({searchParams}:{searchParams:Promise<{id?:string;token?:string}>}){const p=await searchParams;return <section className="container section"><h1>Stop saved-search alerts</h1><p>You can still browse and chat with Pax.</p><Unsubscribe id={p.id||''} token={p.token||''}/></section>;}
