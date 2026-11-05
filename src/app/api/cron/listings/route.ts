import {snapshotErrorDetail} from '@/server/listings/snapshot-errors';
import {timingSafeEqual} from 'node:crypto';
import {refreshSnapshot} from '@/server/listings/snapshot';
export const maxDuration=300;
export async function GET(req:Request){
 const expected=process.env.CRON_SECRET?`Bearer ${process.env.CRON_SECRET}`:'';
 const actual=req.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return new Response('Unauthorized',{status:401});
 try{return Response.json(await refreshSnapshot());}catch(error){console.error('Listing snapshot refresh failed; previous snapshot retained:',snapshotErrorDetail(error));return Response.json({error:'Inventory refresh failed.'},{status:503});}
}
