"use client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import { useEffect, useState } from "react";
import Link from "next/link";
import { type Listing, listingPrice } from "@/lib/listings";
function FitBounds({listings}:{listings:Listing[]}){
 const map=useMap();
 useEffect(()=>{if(listings.length)map.fitBounds(latLngBounds(listings.map(l=>[l.latitude,l.longitude])),{padding:[45,45],maxZoom:13});else map.setView([26.68,-80.13],10);},[listings,map]);return null;
}
export default function ListingsMap({listings}:{listings:Listing[]}){
 const [tileError,setTileError]=useState(false);
 return <><MapContainer center={[26.68,-80.13]} zoom={10} scrollWheelZoom={false} aria-label="Map of listing locations"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}}/><FitBounds listings={listings}/>{listings.map(l=><Marker key={l.id} position={[l.latitude,l.longitude]} icon={divIcon({html:`<span class="map-price">$${l.price>=1000000?(l.price/1000000).toFixed(2)+"m":(l.price/1000).toFixed(l.price<10000?1:0)+"k"}</span>`,className:"",iconSize:[65,30],iconAnchor:[32,15]})}><Popup><strong>{listingPrice(l)}</strong><p>{l.address}<br/>{l.city}{l.isSample && <><br/>Sample · approximate location</>}</p><Link href={`/listings/${l.slug}`}>View property →</Link></Popup></Marker>)}</MapContainer>{tileError && <div className="map-status" role="status">Map tiles could not load. Listing details and approximate location markers remain available.</div>}</>;
}
