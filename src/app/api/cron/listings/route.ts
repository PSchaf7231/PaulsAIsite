import {snapshotErrorDetail} from '@/server/listings/snapshot-errors';
import {timingSafeEqual} from 'node:crypto';
import {syncListings} from '@/server/listings/sync';
export const maxDuration=300;
export async function GET(req:Request){
 const expected=process.env.CRON_SECRET?`Bearer ${process.env.CRON_SECRET}`:'';
 const actual=req.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return new Response('Unauthorized',{status:401});
 // Leaves ~30 s of the 300 s function limit for the final status write; unfinished rows resume next hour.
 try{return Response.json(await syncListings({budgetMs:255000,trigger:'cron'}));}catch(error){console.error('Listing sync failed; existing rows retained:',snapshotErrorDetail(error));return Response.json({error:'Inventory refresh failed.'},{status:503});}
}
