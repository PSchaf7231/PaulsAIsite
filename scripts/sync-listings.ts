// Build-time MLS sync. Never fails the build: if the sync cannot finish, the deploy uses the rows already in the database
// and the hourly cron continues the work.
import {syncListings,closeSyncDatabase,syncStatus} from '../src/server/listings/sync';
import {closeReadDatabase} from '../src/server/listings/store';
import {sparkConfigured} from '../src/server/listings/spark';
import {snapshotErrorDetail} from '../src/server/listings/snapshot-errors';
const BUILD_BUDGET_MS=Number(process.env.LISTING_SYNC_BUILD_BUDGET_MS||420000);
const FRESH_MS=2*60*60*1000;
async function main(){
 if(process.env.VERCEL_ENV==='production'&&sparkConfigured()&&!process.env.CRON_SECRET)console.warn('Listing sync: CRON_SECRET is missing, so the hourly refresh cannot run.');
 if(!sparkConfigured()){
  console.log('Listing sync: MLS not configured in this environment; skipping. Existing database rows (if any) are used.');
  try{const status=await syncStatus();console.log('Listing sync: stored status',status?{activeCount:status.activeCount,lastSuccessAt:status.lastSuccessAt,lastCompleteAt:status.lastCompleteAt}:'none');}catch(error){console.log('Listing sync: status unavailable:',snapshotErrorDetail(error));}
  return;
 }
 try{
  const status=await syncStatus();
  if(process.env.LISTING_SYNC_FORCE!=='1'&&status?.lastCompleteAt&&Date.now()-new Date(status.lastCompleteAt).getTime()<FRESH_MS&&status.activeCount>0){
   console.log('Listing sync: a complete sync finished recently; skipping at build time.',{activeCount:status.activeCount,lastCompleteAt:status.lastCompleteAt});return;
  }
 }catch{/* table may not exist yet locally; the sync below reports the real error */}
 console.log('Listing sync: starting MLS download and row upserts.');
 const result=await syncListings({budgetMs:BUILD_BUDGET_MS,trigger:'build',onProgress:progress=>console.log('Listing sync progress:',progress)});
 console.log('Listing sync:',result);
}
const hardStop=setTimeout(()=>{console.error('Listing sync: exceeded the build time limit; continuing the build with existing rows.');process.exit(0);},BUILD_BUDGET_MS+240000);
hardStop.unref();
// Only exception: a production MLS build with zero stored homes (first rollout) fails, so the previous deployment stays live
// instead of publishing a site whose listings say "temporarily unavailable".
async function usableRows(){try{return ((await syncStatus())?.activeCount??0)>0;}catch{return false;}}
main().catch(error=>{console.error('Listing sync failed; continuing the build with existing database rows:',snapshotErrorDetail(error));})
 .then(async()=>{
  if(process.env.VERCEL_ENV==='production'&&sparkConfigured()&&!(await usableRows())){console.error('Listing sync: production has no stored listings yet; failing this build so the previous deployment stays live.');process.exitCode=1;}
  else process.exitCode=0;
 })
 .finally(async()=>{await Promise.allSettled([closeSyncDatabase(),closeReadDatabase()]);});
