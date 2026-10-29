"use client";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listings";
const Map = dynamic(()=>import("./listings-map"),{ssr:false,loading:()=> <div className="loading">Loading map…</div>});
export default function MapPanel({listings}:{listings:Listing[]}){return <div className="map-shell" aria-label="Listing map"><Map listings={listings}/></div>}
