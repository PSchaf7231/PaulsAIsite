import { indexingEnabled } from '@/lib/seo';
import { siteUrl } from '@/lib/config';
import { fetchSpark,sparkConfigured } from '@/server/listings/spark';
import { xmlResponse,urlset } from '@/server/listings/sitemaps';
export const dynamic='force-dynamic';
export async function GET(_req:Request,{params}:{params:Promise<{page:string}>}){const page=(await params).page;if(!/^\d{1,3}$/.test(page)||Number(page)>499)return new Response('Not found',{status:404});if(!indexingEnabled()||!sparkConfigured())return xmlResponse(urlset([]));try{const data=await fetchSpark({}, {limit:1000,offset:Number(page)*1000,lean:true});return xmlResponse(urlset(data.listings.map(l=>({url:`${siteUrl()}/listings/${l.slug}`,updatedAt:l.updatedAt}))));}catch{return new Response('MLS sitemap temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});}}
