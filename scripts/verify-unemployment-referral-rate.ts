import {loadEnvConfig} from "@next/env";loadEnvConfig(process.cwd());
async function main(){const {getUnemploymentRows}=await import("../src/lib/unemploymentReport");const {queryReadOnlyUncached,closePool}=await import("../src/lib/db/sql");try{
 const p={startDate:"2026-01-02",endDate:"2026-11-13"};
 const rows=await getUnemploymentRows(p);
 const expected=await queryReadOnlyUncached<{id:string;rate:number|null}>(`SELECT CAST(e.EmployeeID AS varchar(30)) id,COALESCE(t.AgencyReferralRatePerHr,e.AgencyReferralRatePerHr) rate FROM dbo.tblEmployee e
 OUTER APPLY(SELECT TOP(1) AgencyReferralRatePerHr FROM dbo.tblTracking t WHERE t.EmployeeID=e.EmployeeID AND t.WeekEndingDate>='20260102' AND t.WeekEndingDate<'20261114' ORDER BY t.WeekEndingDate DESC,t.TrackingID DESC) t`);
 const rates=new Map(expected.map(r=>[r.id,r.rate]));
 if(rows.some(r=>r.agencyReferralRate!==rates.get(r.id)))throw new Error("Referral rate mismatch");
 console.log(JSON.stringify({rows:rows.length,withRate:rows.filter(r=>r.agencyReferralRate!=null).length,nonzeroRates:rows.filter(r=>Number(r.agencyReferralRate)!==0).length,ratesMatch:true}));
 }finally{await closePool();}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
