import { notFound } from "next/navigation";
import { guides } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
import Article from "@/components/article";
export function generateStaticParams(){return guides.map(a=>({slug:a.slug}));}
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const a=guides.find(a=>a.slug===slug);return a?pageMetadata(a.title,a.excerpt,`/guides/${slug}`):{title:"Article not found"};}
export default async function Page({params}:Props){const {slug}=await params;const a=guides.find(a=>a.slug===slug);if(!a)notFound();return <Article article={a}/>}
