import {listingQuerySchema} from '@/lib/listing-query';
import { searchInventory } from '@/server/listings/service';
export async function GET(req:Request){const parsed=listingQuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));if(!parsed.success)return Response.json({error:'Invalid search filters.'},{status:400});return Response.json(await searchInventory(parsed.data),{headers:{'Cache-Control':'no-store'}});}
