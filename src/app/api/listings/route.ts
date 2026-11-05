import {listingQuerySchema} from '@/lib/listing-query';
import {searchInventory} from '@/server/listings/service';
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;const page=Number(params.get('page')||1);params.delete('page');
 const parsed=listingQuerySchema.safeParse(Object.fromEntries(params));
 if(!parsed.success||!Number.isSafeInteger(page)||page<1||page>5000)return Response.json({error:'Invalid search filters.'},{status:400});
 const result=await searchInventory(parsed.data,{limit:24,offset:(page-1)*24});
 return Response.json(result,{status:result.mode==='unavailable'?503:200,headers:{'Cache-Control':'no-store'}});
}
