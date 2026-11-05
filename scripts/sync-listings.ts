import {refreshSnapshot,closeSnapshotDatabase} from '../src/server/listings/snapshot';
import {sparkConfigured} from '../src/server/listings/spark';
import {snapshotErrorDetail} from '../src/server/listings/snapshot-errors';
async function main(){
 try{
  if(process.env.VERCEL_ENV==='production'&&sparkConfigured()&&!process.env.CRON_SECRET)throw new Error('CRON_SECRET is required for scheduled refreshes.');
  if(sparkConfigured()){
   console.log('Listing snapshot: starting database connection and MLS refresh.');
   console.log('Listing snapshot:',await refreshSnapshot(progress=>console.log('Listing snapshot progress:',progress)));
  }else console.log('MLS not configured; skipping listing snapshot.');
 }finally{await closeSnapshotDatabase();}
}
main().catch(error=>{console.error('Listing snapshot setup failed:',snapshotErrorDetail(error));process.exitCode=1;});
