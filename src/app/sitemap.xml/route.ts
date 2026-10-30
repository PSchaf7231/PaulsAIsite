import { indexingEnabled } from '@/lib/seo';
import { siteUrl } from '@/lib/config';
import { sparkConfigured,sparkCount } from '@/server/listings/spark';
import { xml,xmlResponse,urlset,publicPages } from '@/server/listings/sitemaps';
export const dynamic='force-dynamic';
export async function GET(){
 if(!indexingEnabled())return xmlResponse(urlset([]));if(!sparkConfigured())return xmlResponse(urlset(publicPages()));
 try{const count=await sparkCount();const paths=['/sitemaps/pages.xml',...Array.from({length:Math.ceil(count/1000)},(_,i)=>`/sitemaps/listings/${i}`)];return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<sitemap><loc>${xml(siteUrl()+path)}</loc></sitemap>`).join('')}</sitemapindex>`);}catch{return new Response('MLS sitemap temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});}
}
