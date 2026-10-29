"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, latLngBounds, type Marker as LeafletMarker } from "leaflet";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { type Listing, listingPrice } from "@/lib/listings";
function FitBounds({listings}:{listings:Listing[]}){
 const map=useMap();
 useEffect(()=>{if(listings.length)map.fitBounds(latLngBounds(listings.map(l=>[l.latitude,l.longitude])),{padding:[45,45],maxZoom:13});else map.setView([26.68,-80.13],10);},[listings,map]);return null;
}
function ResultMarker({listing:l,index,selected,focusRequest,numbered}:{listing:Listing;index:number;selected:boolean;focusRequest?:number;numbered:boolean}){
 const marker=useRef<LeafletMarker>(null),map=useMap();
 useEffect(()=>{if(selected){map.setView([l.latitude,l.longitude],13);marker.current?.openPopup();}},[selected,focusRequest,l.latitude,l.longitude,map]);
 return <Marker ref={marker} position={[l.latitude,l.longitude]} icon={divIcon({html:`<span class="map-price">${numbered?`#${index+1} · `:''}$${l.price>=1000000?(l.price/1000000).toFixed(2)+"m":(l.price/1000).toFixed(l.price<10000?1:0)+"k"}</span>`,className:"",iconSize:[numbered?90:65,30],iconAnchor:[32,15]})}><Popup><strong>{numbered?`#${index+1} · `:''}{listingPrice(l)}</strong><p>{l.address}<br/>{l.city}{l.isSample && <><br/>Sample · approximate location</>}</p><Link href={`/listings/${l.slug}`}>View property →</Link></Popup></Marker>;
}
export default function ListingsMap({listings,selectedSlug,focusRequest,numbered=false}:{listings:Listing[];selectedSlug?:string;focusRequest?:number;numbered?:boolean}){
 const [tileError,setTileError]=useState(false);
 return <><MapContainer center={[26.68,-80.13]} zoom={10} scrollWheelZoom={false} aria-label="Map of listing locations"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}}/><FitBounds listings={listings}/>{listings.map((l,index)=><ResultMarker key={l.id} listing={l} index={index} selected={selectedSlug===l.slug} focusRequest={focusRequest} numbered={numbered}/>)}</MapContainer>{tileError && <div className="map-status" role="status">Map tiles could not load. Listing details and approximate location markers remain available.</div>}</>;
}
