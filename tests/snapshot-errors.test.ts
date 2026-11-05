import {it,expect} from 'vitest';
import {snapshotErrorDetail} from '../src/server/listings/snapshot-errors';
it('distinguishes the refresh budget, MLS authorization, database timeout and missing cron secret',()=>{
 for(const message of ['Inventory refresh exceeded its time budget; previous snapshot retained.','Spark request failed (401).','CRON_SECRET is required for scheduled refreshes.'])expect(snapshotErrorDetail(new Error(message))).toBe(message);
 expect(snapshotErrorDetail({code:'57014'})).toBe('Database statement timed out.');
 expect(snapshotErrorDetail({name:'TimeoutError'})).toContain('MLS request timed out');
});
it('never logs arbitrary provider errors containing credentials or database URLs',()=>{
 expect(snapshotErrorDetail(new Error('postgresql://user:unique-test-secret@db.example/key'))).not.toContain('unique-test-secret');
 expect(snapshotErrorDetail({code:'secret-token',message:'Bearer secret-token'})).not.toContain('secret-token');
});
