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
