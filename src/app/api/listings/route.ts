import { z } from 'zod';
import { searchInventory } from '@/server/listings/service';
const number=z.coerce.number().min(0).max(100000000).optional();
const schema=z.object({city:z.string().max(80).optional(),type:z.enum(['SALE','RENT','COMMERCIAL']).optional(),minPrice:number,maxPrice:number,beds:z.coerce.number().int().min(0).max(30).optional(),baths:z.coerce.number().min(0).max(30).optional(),sort:z.enum(['price-asc','price-desc']).optional()}).strict();
export async function GET(req:Request){const parsed=schema.safeParse(Object.fromEntries(new URL(req.url).searchParams));if(!parsed.success)return Response.json({error:'Invalid search filters.'},{status:400});return Response.json(await searchInventory(parsed.data),{headers:{'Cache-Control':'no-store'}});}
