import { notFound } from "next/navigation";
import { posts } from "@/lib/articles";
import { pageMetadata } from "@/lib/seo";
import Article from "@/components/article";
export function generateStaticParams(){return posts.map(a=>({slug:a.slug}));}
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const a=posts.find(a=>a.slug===slug);return a?pageMetadata(a.title,a.excerpt,`/blog/${slug}`):{title:"Article not found"};}
export default async function Page({params}:Props){const {slug}=await params;const a=posts.find(a=>a.slug===slug);if(!a)notFound();return <Article article={a}/>}
