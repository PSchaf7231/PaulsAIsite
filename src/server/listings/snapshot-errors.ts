// Only report known diagnostic messages/codes; never dump URLs, headers or credentials.
export function snapshotErrorDetail(error:unknown):string{
 const e=error as {message?:string;name?:string;code?:string};
 const message=typeof e?.message==='string'?e.message:'';
 const known=[
  'CRON_SECRET is required for scheduled refreshes.',
  'Inventory refresh exceeded its time budget; previous snapshot retained.',
  'Inventory pagination did not advance.',
  'Inventory refresh exceeded its safety limit.',
  'Spark is not configured.',
  'Invalid Spark endpoint.',
  'Invalid Spark pagination link.',
  'Repeated Spark pagination link.',
  'Invalid Spark response.'
 ];
 if(known.includes(message)||/^Spark request failed \(\d{3}\)\.$/.test(message))return message;
 if(e?.name==='TimeoutError'||e?.name==='AbortError')return 'MLS request timed out or was aborted.';
 const codes:Record<string,string>={'28P01':'Database authentication failed.','42501':'Database permission denied.','42P01':'Snapshot table is missing.','57014':'Database statement timed out.',ECONNREFUSED:'Connection refused.',ENOTFOUND:'Host lookup failed.',ETIMEDOUT:'Connection timed out.'};
 return (e?.code&&Object.hasOwn(codes,e.code)&&codes[e.code])||'Unclassified failure; no private connection details were logged.';
}
