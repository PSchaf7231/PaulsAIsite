import type { Metadata } from "next";
import { agent } from "./config";
export function pageMetadata(title: string, description: string, path: string): Metadata {
 return { title, description, alternates:{canonical:path},openGraph:{title:`${title} | ${agent.brandName}`,description,url:path,type:"website"} };
}
