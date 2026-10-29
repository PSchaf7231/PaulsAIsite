import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { communities } from "@/lib/communities";
import { guides, posts } from "@/lib/articles";
import { listingsService } from "@/server/listings";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const listings=await listingsService().search();const paths=["","/listings","/communities","/about","/contact","/guides","/blog","/privacy","/terms","/mls-disclosure","/pax",...communities.map(c=>`/communities/${c.slug}`),...guides.map(a=>`/guides/${a.slug}`),...posts.map(a=>`/blog/${a.slug}`),...listings.filter(l=>!l.isSample).map(l=>`/listings/${l.slug}`)];return paths.map(path=>({url:`${siteUrl()}${path}`,changeFrequency:"weekly",priority:path?0.7:1}));}
