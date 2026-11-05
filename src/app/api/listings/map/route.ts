import {listingQuerySchema} from '@/lib/listing-query';
import {mapInventory} from '@/lib/map-inventory';
import {readSnapshot} from '@/server/listings/snapshot';
import {sparkConfigured} from '@/server/listings/spark';
import {sampleListings} from '@/server/listings/sample';
export async function GET(req:Request){
 const parsed=listingQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
 if(!parsed.success)return Response.json({error:'Invalid map filters.'},{status:400});
 try{
  const live=sparkConfigured(),source=live?await readSnapshot():{listings:sampleListings,checkedAt:new Date().toISOString()};
  return Response.json({...mapInventory(source.listings,parsed.data),mode:live?'live':'sample',checkedAt:source.checkedAt},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Map inventory is temporarily unavailable. Please retry.'},{status:503});}
}
