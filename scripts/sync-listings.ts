import {refreshSnapshot,closeSnapshotDatabase} from '../src/server/listings/snapshot';
import {sparkConfigured} from '../src/server/listings/spark';
async function main(){try{if(process.env.VERCEL_ENV==='production'&&sparkConfigured()&&!process.env.CRON_SECRET)throw new Error('CRON_SECRET is required for scheduled refreshes.');if(sparkConfigured())console.log('Listing snapshot:',await refreshSnapshot());else console.log('MLS not configured; skipping listing snapshot.');}finally{await closeSnapshotDatabase();}}
main().catch(()=>{console.error('Listing snapshot setup failed. Verify CRON_SECRET, MLS credentials, and database configuration in Vercel Production.');process.exitCode=1;});
