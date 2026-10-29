"use client";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listings";
const Map = dynamic(()=>import("./listings-map"),{ssr:false,loading:()=> <div className="loading">Loading map…</div>});
export default function MapPanel({listings,selectedSlug,focusRequest,numbered=false}:{listings:Listing[];selectedSlug?:string;focusRequest?:number;numbered?:boolean}){return <div className="map-shell" aria-label="Listing map"><Map listings={listings} selectedSlug={selectedSlug} focusRequest={focusRequest} numbered={numbered}/></div>}
