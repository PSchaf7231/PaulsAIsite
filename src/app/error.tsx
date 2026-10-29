"use client";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="article"><h1>We couldn’t load this page.</h1><p>The data service may be unavailable. Try again shortly. If you’re setting up the site, check the database connection and migrations.</p><button className="btn" onClick={()=>reset()}>Try again</button></div>}
