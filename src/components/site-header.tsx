"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { agent } from "@/lib/config";
const links = [["/listings","Find a home"],["/communities","Communities"],["/about","The Team"],["/guides","Resources"]];
export function Brand({header=false}:{header?:boolean}) {return <Link href="/" className={`brand${header ? " brand-header" : ""}`} aria-label={`${agent.brandName} home`}><svg className="pb-brand-logo" width="46" height="46" viewBox="0 0 800 800" aria-hidden="true"><defs><filter id={header ? "pb-header-white" : "pb-footer-white"} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 1 1 0 -0.4"/></filter></defs><image href="/images/pb-logo.jpg" width="800" height="800" filter={`url(#${header ? "pb-header-white" : "pb-footer-white"})`}/></svg><span><strong>{agent.brandName}</strong><small>{header ? "Where Palm Beach comes home." : agent.name}</small></span></Link>}
export default function SiteHeader() {
 const path=usePathname();
 const navLinks=links.map(([href,label])=><Link key={href} href={href} aria-current={path.startsWith(href)?"page":undefined}>{label}</Link>);
 return <><div className="topbar"><div className="container"><a href={`tel:${agent.phone.replace(/[^+0-9]/g,"")}`}>{agent.phone}</a></div></div><header className="header"><div className="container nav"><Brand header/><nav className="navlinks" aria-label="Main navigation">{navLinks}<Link href="/contact" className="btn small">Let’s talk <span aria-hidden="true">↗</span></Link></nav><details className="mobile-nav"><summary>Menu</summary><nav aria-label="Mobile navigation" onClick={e=>e.currentTarget.closest("details")?.removeAttribute("open")}>{navLinks}<Link href="/contact">Let’s talk ↗</Link></nav></details></div></header></>;
}
