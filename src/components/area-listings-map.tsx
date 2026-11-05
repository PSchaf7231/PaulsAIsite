'use client';
import {useEffect,useState} from 'react';
import {MapContainer,TileLayer,Marker,Popup,useMap,useMapEvents} from 'react-leaflet';
import {divIcon,latLngBounds} from 'leaflet';
import Link from 'next/link';
import {groupMapHomes,type MapHome} from '@/lib/map-inventory';
import {money} from '@/lib/listings';
type Inventory={homes:MapHome[];total:number;missingCoordinates:number;mode:string};
function HomeLinks({homes}:{homes:MapHome[]}){
 const [page,setPage]=useState(0);
 return <div className="map-home-links"><strong>{homes.length===1?'Property':`${homes.length} homes in this group`}</strong>{homes.slice(page*10,(page+1)*10).map(home=><p key={home.id}><Link href={`/listings/${home.slug}`}>{money(home.price)}{home.type==='RENT'?' / month':''} · {home.address}</Link><br/>{home.city}{home.isSample?' · Sample':''}</p>)}{homes.length>10&&<div><button disabled={!page} onClick={()=>setPage(n=>n-1)}>Previous homes</button><span> {page*10+1}–{Math.min((page+1)*10,homes.length)} of {homes.length} </span><button disabled={(page+1)*10>=homes.length} onClick={()=>setPage(n=>n+1)}>More homes</button></div>}</div>;
}
function VisibleHomes({homes}:{homes:MapHome[]}){
 const map=useMap(),[version,setVersion]=useState(0),[openGroup,setOpenGroup]=useState<string|null>(null);
 useMapEvents({moveend:()=>setVersion(n=>n+1),resize:()=>setVersion(n=>n+1)});
 useEffect(()=>{map.invalidateSize();if(homes.length)map.fitBounds(latLngBounds(homes.map(h=>[h.latitude,h.longitude])),{padding:[45,45],maxZoom:13});const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(map.getContainer());return()=>observer.disconnect();},[homes,map]);
 const inView=(h:MapHome)=>map.getBounds().contains([h.latitude,h.longitude]);
 // Cluster membership stays stable during panning, including Leaflet's popup auto-pan.
 const groups=groupMapHomes(homes,()=>true,h=>map.project([h.latitude,h.longitude],map.getZoom())).filter(g=>g.key===openGroup||g.homes.some(inView));
 const visible=homes.filter(inView).length;
 return <><div className="area-map-count" role="status" data-view-version={version}>{visible} matching {visible===1?'home':'homes'} in map view</div>{groups.map(group=><Marker key={group.key} eventHandlers={{popupopen:()=>setOpenGroup(group.key),popupclose:()=>setOpenGroup(current=>current===group.key?null:current)}} position={[group.latitude,group.longitude]} title={group.homes.length===1?group.homes[0].address:`${group.homes.length} matching homes`} icon={divIcon({className:'',html:group.homes.length>1?`<span class="map-cluster">${group.homes.length}</span>`:`<span class="map-price">${money(group.homes[0].price)}${group.homes[0].type==='RENT'?'/mo':''}</span>`,iconSize:[group.homes.length>1?44:95,34],iconAnchor:[22,17]})}><Popup maxHeight={160} maxWidth={240}><HomeLinks key={group.homes.map(h=>h.id).join(',')} homes={group.homes}/>{group.homes.length>1&&map.getZoom()<18&&<button onClick={()=>map.setView([group.latitude,group.longitude],Math.min(map.getZoom()+2,18))}>Zoom into this group</button>}</Popup></Marker>)}</>;
}
export default function AreaListingsMap({filters}:{filters:string}){
 const [data,setData]=useState<Inventory|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0),[tileError,setTileError]=useState(false);
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setData(null);
 async function load(){try{const response=await fetch(`/api/listings/map?${filters}`,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('Map inventory is unavailable.');const result=await response.json();if(!controller.signal.aborted)setData(result);}catch{if(!controller.signal.aborted)setError('Map inventory is unavailable. Your property cards remain available.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[filters,retry]);
 return <div className="area-map"><div className="area-map-summary" aria-live="polite">{loading?'Loading all matching map locations…':error?<>{error} <button onClick={()=>setRetry(n=>n+1)}>Retry map</button></>:data?<>{data.homes.length} mapped homes across all results pages. Move or zoom the map to explore.{data.missingCoordinates>0&&` ${data.missingCoordinates} matching homes have no map coordinates; use the property cards to view them.`}{data.mode==='sample'&&' Sample locations are approximate.'}</>:null}</div><MapContainer center={[26.68,-80.13]} zoom={10} maxZoom={18} scrollWheelZoom={false} aria-label="Map of all matching homes"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}}/>{data&&<VisibleHomes homes={data.homes}/>}</MapContainer>{tileError&&<div className="area-map-summary">Map background could not load. Property locations and links remain available.</div>}</div>;
}
