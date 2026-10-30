import type { MetadataRoute } from 'next';
import { absoluteUrl,indexingEnabled } from '@/lib/seo';
export default function robots():MetadataRoute.Robots{
 const crawlers=['GPTBot','OAI-SearchBot','ChatGPT-User','ClaudeBot','Claude-User','Claude-SearchBot','PerplexityBot','Perplexity-User','Google-Extended'];
 const rule=indexingEnabled()?{allow:['/','/api/og'],disallow:['/admin/','/api/','/alerts/']}:{disallow:'/'};
 return {rules:[{userAgent:'*',...rule},...crawlers.map(userAgent=>({userAgent,...rule}))],sitemap:absoluteUrl('/sitemap.xml')};
}
