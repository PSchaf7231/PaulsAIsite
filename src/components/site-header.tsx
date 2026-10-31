"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { agent } from "@/lib/config";
const links = [["/listings","Find a home"],["/communities","Communities"],["/about","Meet Paul"],["/guides","Resources"]];
export function Brand() {return <Link href="/" className="brand" aria-label={`${agent.brandName} home`}>{agent.logo ? <img src={agent.logo} alt="" width={40} height={45}/> : <span className="brand-mark" aria-hidden="true">P</span>}<span><strong>{agent.brandName}</strong><small>{agent.name}</small></span></Link>}
export default function SiteHeader() {
 const path=usePathname();
 const navLinks=links.map(([href,label])=><Link key={href} href={href} aria-current={path.startsWith(href)?"page":undefined}>{label === "Meet Paul" ? `Meet ${agent.name.split(" ")[0]}` : label}</Link>);
 return <><div className="topbar"><div className="container"><span>Where Palm Beach comes home.</span><a href={`tel:${agent.phone.replace(/[^+0-9]/g,"")}`}>{agent.phone}</a></div></div><header className="header"><div className="container nav"><Brand/><nav className="navlinks" aria-label="Main navigation">{navLinks}<Link href="/contact" className="btn small">Let’s talk <span aria-hidden="true">↗</span></Link></nav><details className="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation" onClick={e=>e.currentTarget.closest("details")?.removeAttribute("open")}>{navLinks}<Link href="/contact">Let’s talk ↗</Link></nav></details></div></header></>;
}
