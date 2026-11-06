import {filterListings,type Listing,type ListingFilters} from './listings';
export type MapHome=Pick<Listing,'id'|'slug'|'address'|'city'|'price'|'type'|'isSample'>&{latitude:number;longitude:number};
export function mapInventory(listings:Listing[],filters:ListingFilters){
 const matches=filterListings(listings,filters);
 const homes:MapHome[]=matches.filter(l=>l.latitude!==null&&l.longitude!==null&&Number.isFinite(l.latitude)&&Number.isFinite(l.longitude)&&Math.abs(l.latitude)<=90&&Math.abs(l.longitude)<=180).map(l=>({id:l.id,slug:l.slug,address:l.address,city:l.city,price:l.price,type:l.type,isSample:l.isSample,latitude:l.latitude!,longitude:l.longitude!}));
 return {homes,total:matches.length,missingCoordinates:matches.length-homes.length};
}
export function groupMapHomes(homes:MapHome[],visible:(home:MapHome)=>boolean,project:(home:MapHome)=>{x:number;y:number}){
 const groups=new Map<string,MapHome[]>();
 for(const home of homes){if(!visible(home))continue;const point=project(home),key=`${Math.floor(point.x/70)}:${Math.floor(point.y/70)}`;const group=groups.get(key);if(group)group.push(home);else groups.set(key,[home]);}
 return [...groups.entries()].map(([key,homes])=>({key,homes,latitude:homes.reduce((n,h)=>n+h.latitude,0)/homes.length,longitude:homes.reduce((n,h)=>n+h.longitude,0)/homes.length}));
}

// ---- Compact, area-limited map payload (Nov 2026) ----
// The map asks only for the visible area (padded) and gets at most MAP_PIN_CAP pins, each a short tuple carrying
// exactly what a marker and its popup show. Every matching home stays reachable: zooming in narrows the area until
// it is under the cap, and the paginated property cards always list the full result set.
export type MapBounds={north:number;south:number;east:number;west:number};
export const MAP_PIN_CAP=2000;
// [slug, address, city, price, latitude, longitude, 1 when a monthly rental]
export type MapPinTuple=[string,string,string,number,number,number]|[string,string,string,number,number,number,1];
export type MapPayload={pins:MapPinTuple[];total:number;missingCoordinates:number;inView:number;truncated:boolean;cap:number;extent:MapBounds|null};
const round5=(n:number)=>Math.round(n*1e5)/1e5;
export function toPinTuple(h:{slug:string;address:string;city:string;price:number;type:string;latitude:number;longitude:number}):MapPinTuple{
 const base:[string,string,string,number,number,number]=[h.slug,h.address,h.city,Math.round(Number(h.price)),round5(Number(h.latitude)),round5(Number(h.longitude))];
 return h.type==='RENT'?[...base,1]:base;
}
export function fromPinTuples(pins:MapPinTuple[],isSample=false):MapHome[]{
 return pins.map(p=>({id:p[0],slug:p[0],address:p[1],city:p[2],price:p[3],latitude:p[4],longitude:p[5],type:p[6]?'RENT':'SALE',isSample}));
}
export const withinBounds=(h:{latitude:number;longitude:number},b:MapBounds)=>h.latitude>=b.south&&h.latitude<=b.north&&h.longitude>=b.west&&h.longitude<=b.east;
export const containsBounds=(outer:MapBounds,inner:MapBounds)=>inner.north<=outer.north&&inner.south>=outer.south&&inner.east<=outer.east&&inner.west>=outer.west;
// Grows an area by `ratio` of its size on every side (clamped to valid coordinates) so small pans reuse the last response.
export function padBounds(b:MapBounds,ratio=0.25):MapBounds{
 const dLat=(b.north-b.south)*ratio,dLng=(b.east-b.west)*ratio;
 return {north:Math.min(90,b.north+dLat),south:Math.max(-90,b.south-dLat),east:Math.min(180,b.east+dLng),west:Math.max(-180,b.west-dLng)};
}
export function extentOf(homes:{latitude:number;longitude:number}[]):MapBounds|null{
 if(!homes.length)return null;
 let north=-90,south=90,east=-180,west=180;
 for(const h of homes){north=Math.max(north,h.latitude);south=Math.min(south,h.latitude);east=Math.max(east,h.longitude);west=Math.min(west,h.longitude);}
 return {north,south,east,west};
}
// Builds the payload from an in-memory list (sample inventory and tests); the database path builds the same shape in SQL.
export function mapPayload(result:{homes:MapHome[];total:number;missingCoordinates:number},bounds?:MapBounds,cap=MAP_PIN_CAP):MapPayload{
 const area=bounds?result.homes.filter(h=>withinBounds(h,bounds)):result.homes;
 return {pins:area.slice(0,cap).map(toPinTuple),total:result.total,missingCoordinates:result.missingCoordinates,inView:area.length,truncated:area.length>cap,cap,extent:bounds?null:extentOf(result.homes)};
}
// Whether loaded pins already show everything for this view: complete results for a larger area, or a capped sample
// of this area at the same zoom (panning inside it). Zooming into a capped area asks again for the smaller area.
export function viewIsCovered(loaded:{bounds:MapBounds|null;truncated:boolean;zoom:number|null},view:MapBounds,zoom:number){
 if(loaded.bounds&&!containsBounds(loaded.bounds,view))return false;
 return !loaded.truncated||loaded.zoom===zoom;
}
