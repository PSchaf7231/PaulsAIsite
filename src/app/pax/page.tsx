import { redirect } from "next/navigation";
import { pageMetadata } from '@/lib/seo';
export const metadata=pageMetadata('Ask Madison','Open the Palm Beach Real Estate Pros AI-assisted property search.','/pax',{noindex:true});
export default function Madison(){redirect("/?pax=open")}
