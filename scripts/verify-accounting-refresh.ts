import {loadEnvConfig} from "@next/env";loadEnvConfig(process.cwd());
async function main(){
 const {queryReadOnly,withFreshDatabaseReads,closePool}=await import("../src/lib/db/sql");
 const {accountingDataLoaders}=await import("../src/lib/accountingReportData");
 try{
 const query="SELECT CONVERT(varchar(36),NEWID()) token";
 const [cached]=await queryReadOnly<{token:string}>(query),[cachedAgain]=await queryReadOnly<{token:string}>(query);
 const [fresh]=await withFreshDatabaseReads(()=>queryReadOnly<{token:string}>(query)),[freshAgain]=await withFreshDatabaseReads(()=>queryReadOnly<{token:string}>(query));
 if(cached.token!==cachedAgain.token||cached.token===fresh.token||fresh.token===freshAgain.token)throw new Error("Fresh-read context failed");
 const results=[];
 for(const [report,load] of Object.entries(accountingDataLoaders)){
 const result=await withFreshDatabaseReads<unknown>(()=>load({startDate:"2026-11-07",endDate:"2026-11-13",payrollCompany:"",state:"",jobAppStatus:"All"}));
 const rows=Array.isArray(result)?result:(result as {rows:unknown[]}).rows;
 if(!Array.isArray(rows))throw new Error("Invalid result: "+report);
 results.push({report,rows:rows.length});
 }
 console.log(JSON.stringify({uncachedReadsVerified:true,reports:results}));
 }finally{await closePool();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
