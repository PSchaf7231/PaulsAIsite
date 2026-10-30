import { siteUrl } from '../../lib/config';
import { communities } from '../../lib/communities';
import { guides,posts } from '../../lib/articles';
export const xml=(value:string)=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export function urlset(entries:{url:string;updatedAt?:string}[]){return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(e=>`<url><loc>${xml(e.url)}</loc>${e.updatedAt?`<lastmod>${xml(e.updatedAt)}</lastmod>`:''}</url>`).join('')}</urlset>`;}
export function publicPages(){return ['', '/listings','/communities','/about','/contact','/guides','/blog','/privacy','/terms','/mls-disclosure',...communities.filter(c=>c.reviewed).map(c=>`/communities/${c.slug}`),...guides.map(a=>`/guides/${a.slug}`),...posts.map(a=>`/blog/${a.slug}`)].map(path=>({url:siteUrl()+path}));}
export function xmlResponse(body:string){return new Response(body,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300'}});}
