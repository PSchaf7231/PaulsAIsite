import { indexingEnabled } from '@/lib/seo';
import { xmlResponse,urlset,publicPages } from '@/server/listings/sitemaps';
export function GET(){return xmlResponse(urlset(indexingEnabled()?publicPages():[]));}
