import {loadEnvConfig} from '@next/env';
loadEnvConfig(process.cwd());
async function main(){const {queryReadOnly,closePool}=await import('../src/lib/db/sql');try{const rows=await queryReadOnly("SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND (TABLE_NAME LIKE '%Customer%' OR TABLE_NAME LIKE '%PullDown%') ORDER BY TABLE_NAME,ORDINAL_POSITION");await import('node:fs/promises').then(fs=>fs.writeFile('customer-profile-schema.json',JSON.stringify(rows,null,2))); console.log('Schema columns:',rows.length);}finally{await closePool();}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
