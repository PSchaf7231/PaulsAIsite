'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {MapContainer,TileLayer,Marker,Popup,useMap,useMapEvents} from 'react-leaflet';
import {divIcon,latLngBounds,type Map as LeafletMap} from 'leaflet';
import Link from 'next/link';
import {groupMapHomes,fromPinTuples,padBounds,viewIsCovered,type MapHome,type MapBounds,type MapPayload} from '@/lib/map-inventory';
import {money} from '@/lib/listings';
// One loaded map area: `bounds` null means the first, unbounded request for a search (it also returns the extent of all matches).
type Inventory={filters:string;bounds:MapBounds|null;zoom:number|null;homes:MapHome[];total:number;missingCoordinates:number;inView:number;truncated:boolean;mode:string};
type Request={filters:string;bounds:MapBounds|null;zoom:number|null};
const VIEW_DEBOUNCE_MS=300;
function viewOf(map:LeafletMap):MapBounds{
 const b=map.getBounds(),clamp=(n:number,max:number)=>Math.max(-max,Math.min(max,n));
 return {north:clamp(b.getNorth(),90),south:clamp(b.getSouth(),90),east:clamp(b.getEast(),180),west:clamp(b.getWest(),180)};
}
function HomeLinks({homes}:{homes:MapHome[]}){
 const [page,setPage]=useState(0);
 return <div className="map-home-links"><strong>{homes.length===1?'Property':`${homes.length} homes in this group`}</strong>{homes.slice(page*10,(page+1)*10).map(home=><p key={home.id}><Link href={`/listings/${home.slug}`}>{money(home.price)}{home.type==='RENT'?' / month':''} · {home.address}</Link><br/>{home.city}{home.isSample?' · Sample':''}</p>)}{homes.length>10&&<div><button disabled={!page} onClick={()=>setPage(n=>n-1)}>Previous homes</button><span> {page*10+1}–{Math.min((page+1)*10,homes.length)} of {homes.length} </span><button disabled={(page+1)*10>=homes.length} onClick={()=>setPage(n=>n+1)}>More homes</button></div>}</div>;
}
function VisibleHomes({data,fit,onView}:{data:Inventory;fit:{extent:MapBounds;id:number}|null;onView:(view:MapBounds,zoom:number)=>void}){
 const map=useMap(),[version,setVersion]=useState(0),[openGroup,setOpenGroup]=useState<string|null>(null),timer=useRef<ReturnType<typeof setTimeout>>(undefined);
 const homes=data.homes;
 useMapEvents({moveend:()=>{setVersion(n=>n+1);clearTimeout(timer.current);timer.current=setTimeout(()=>onView(viewOf(map),map.getZoom()),VIEW_DEBOUNCE_MS);},resize:()=>setVersion(n=>n+1)});
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 useEffect(()=>{map.invalidateSize();const observer=new ResizeObserver(()=>map.invalidateSize());observer.observe(map.getContainer());return()=>observer.disconnect();},[map]);
 // Frame all matching homes once per search; later area requests never move the map.
 useEffect(()=>{if(fit)map.fitBounds(latLngBounds([[fit.extent.south,fit.extent.west],[fit.extent.north,fit.extent.east]]),{padding:[45,45],maxZoom:13});},[fit,map]);
 const inView=(h:MapHome)=>map.getBounds().contains([h.latitude,h.longitude]);
 // Cluster membership stays stable during panning, including Leaflet's popup auto-pan.
 const groups=groupMapHomes(homes,()=>true,h=>map.project([h.latitude,h.longitude],map.getZoom())).filter(g=>g.key===openGroup||g.homes.some(inView));
 const visible=homes.filter(inView).length;
 return <><div className="area-map-count" role="status" data-view-version={version}>{data.truncated?`Showing ${homes.length.toLocaleString('en-US')} of ${data.inView.toLocaleString('en-US')} matching homes in this area. Zoom in to see more.`:`${visible} matching ${visible===1?'home':'homes'} in map view`}</div>{groups.map(group=><Marker key={group.key} eventHandlers={{popupopen:()=>setOpenGroup(group.key),popupclose:()=>setOpenGroup(current=>current===group.key?null:current)}} position={[group.latitude,group.longitude]} title={group.homes.length===1?group.homes[0].address:`${group.homes.length} matching homes`} icon={divIcon({className:'',html:group.homes.length>1?`<span class="map-cluster">${group.homes.length}</span>`:`<span class="map-price">${money(group.homes[0].price)}${group.homes[0].type==='RENT'?'/mo':''}</span>`,iconSize:[group.homes.length>1?44:95,34],iconAnchor:[22,17]})}><Popup maxHeight={160} maxWidth={240}><HomeLinks key={group.homes.map(h=>h.id).join(',')} homes={group.homes}/>{group.homes.length>1&&map.getZoom()<18&&<button onClick={()=>map.setView([group.latitude,group.longitude],Math.min(map.getZoom()+2,18))}>Zoom into this group</button>}</Popup></Marker>)}</>;
}
export default function AreaListingsMap({filters}:{filters:string}){
 const [data,setData]=useState<Inventory|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0),[tileError,setTileError]=useState(false);
 const [request,setRequest]=useState<Request>({filters,bounds:null,zoom:null}),[fit,setFit]=useState<{extent:MapBounds;id:number}|null>(null);
 // A new search starts again from the unbounded request.
 if(request.filters!==filters)setRequest({filters,bounds:null,zoom:null});
 const latest=useRef<Inventory|null>(null);useEffect(()=>{latest.current=data;},[data]);
 useEffect(()=>{const controller=new AbortController(),fresh=!request.bounds;setLoading(true);setError('');if(fresh){setData(null);setFit(null);}
 const query=new URLSearchParams(request.filters);if(request.bounds)for(const [k,v] of Object.entries(request.bounds))query.set(k,v.toFixed(5));
 async function load(){try{const response=await fetch(`/api/listings/map?${query}`,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw new Error('Map inventory is unavailable.');const result=await response.json() as MapPayload&{mode:string};if(controller.signal.aborted)return;
  setData({filters:request.filters,bounds:request.bounds,zoom:request.zoom,homes:fromPinTuples(result.pins,result.mode==='sample'),total:result.total,missingCoordinates:result.missingCoordinates,inView:result.inView,truncated:result.truncated,mode:result.mode});
  if(fresh&&result.extent)setFit({extent:result.extent,id:Date.now()});}catch{if(!controller.signal.aborted)setError('Map inventory is unavailable. Your property cards remain available.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[request,retry]);
 // Ask for the visible area (padded) only when the loaded pins do not already cover it.
 const onView=useCallback((view:MapBounds,zoom:number)=>{const loaded=latest.current;if(!loaded||loaded.filters!==filters||viewIsCovered(loaded,view,zoom))return;setRequest({filters,bounds:padBounds(view),zoom});},[filters]);
 return <div className="area-map"><div className="area-map-summary" aria-live="polite">{loading&&!data?'Loading all matching map locations…':error?<>{error} <button onClick={()=>setRetry(n=>n+1)}>Retry map</button></>:data?<>{(data.total-data.missingCoordinates).toLocaleString('en-US')} mapped homes across all results pages. Move or zoom the map to explore.{data.missingCoordinates>0&&` ${data.missingCoordinates} matching homes have no map coordinates; use the property cards to view them.`}{data.mode==='sample'&&' Sample locations are approximate.'}</>:null}</div><MapContainer center={[26.68,-80.13]} zoom={10} maxZoom={18} scrollWheelZoom={false} aria-label="Map of all matching homes"><TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}}/>{data&&<VisibleHomes data={data} fit={fit} onView={onView}/>}</MapContainer>{tileError&&<div className="area-map-summary">Map background could not load. Property locations and links remain available.</div>}</div>;
}
