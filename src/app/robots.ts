import type { MetadataRoute } from 'next';
import { absoluteUrl,indexingEnabled } from '@/lib/seo';
export default function robots():MetadataRoute.Robots{return {rules:indexingEnabled()?{userAgent:'*',allow:['/','/api/og'],disallow:['/admin/','/api/','/alerts/']}:{userAgent:'*',disallow:['/','/api/og']},sitemap:absoluteUrl('/sitemap.xml')};}
