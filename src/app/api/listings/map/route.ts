import {listingQuerySchema} from '@/lib/listing-query';
import {mapListings} from '@/server/listings/service';
// Compact pins ([slug, address, city, price, lat, lng, rent?]) for one map area, capped at MAP_PIN_CAP with the in-area count.
// Optional north/south/east/west limit pins to that area; without them the response also carries the extent of all matches.
export async function GET(req:Request){
 const params=new URL(req.url).searchParams,box=['north','south','east','west'].map(k=>params.get(k));
 for(const k of ['north','south','east','west'])params.delete(k);
 const parsed=listingQuerySchema.safeParse(Object.fromEntries(params));
 if(!parsed.success)return Response.json({error:'Invalid map filters.'},{status:400});
 let bounds;
 if(box.some(v=>v!==null)){
  const [north,south,east,west]=box.map(Number);
  if(![north,south,east,west].every(Number.isFinite)||north<south||east<west||Math.abs(north)>90||Math.abs(south)>90||Math.abs(east)>180||Math.abs(west)>180)return Response.json({error:'Invalid map bounds.'},{status:400});
  bounds={north,south,east,west};
 }
 try{
  return Response.json(await mapListings(parsed.data,bounds),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Map inventory is temporarily unavailable. Please retry.'},{status:503});}
}
