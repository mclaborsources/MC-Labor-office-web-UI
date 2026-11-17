import {loadEnvConfig} from "@next/env";loadEnvConfig(process.cwd());
async function main(){
 const {queryReadOnlyUncached,closePool}=await import("../src/lib/db/sql");
 const {getAccountingPayrollLedger}=await import("../src/lib/accountingPayrollLedger");
 const {normalizeTotalPayrollCriteria}=await import("../src/lib/totalPayrollCriteria");
 try{
 const combinations=await queryReadOnlyUncached<{state:string;company:string}>(`SELECT TOP(8) t.SiteState state,t.PayrollCoOnSiteInitials company
 FROM dbo.tblTracking t WHERE t.EmployeeID IS NOT NULL AND t.WeekEndingDate>='20250101' AND t.WeekEndingDate<'20261114'
 AND NULLIF(t.SiteState,'') IS NOT NULL AND NULLIF(t.PayrollCoOnSiteInitials,'') IS NOT NULL
 AND (t.SiteState<>'MA' OR t.PayrollCoOnSiteInitials<>'IPG')
 GROUP BY t.SiteState,t.PayrollCoOnSiteInitials ORDER BY COUNT(*) DESC`);
 const cases=[{state:"",company:""},...combinations];
 const results=[];
 for(const c of cases){
 const p=normalizeTotalPayrollCriteria({startDate:"2025-01-01",endDate:"2026-11-13",state:c.state,payrollCompany:c.company,addressMode:"job",jobAppStatus:"All"});
 const rows=await getAccountingPayrollLedger(p);
 const expected=await queryReadOnlyUncached<{id:string}>(`SELECT CAST(t.TrackingID AS varchar(30)) id FROM dbo.tblTracking t
 WHERE t.EmployeeID IS NOT NULL AND t.WeekEndingDate>=@start AND t.WeekEndingDate<DATEADD(day,1,CAST(@end AS date))
 AND (@state='' OR t.SiteState=@state) AND (@company='' OR t.PayrollCoOnSiteInitials=@company)`,[{name:"start",value:p.startDate},{name:"end",value:p.endDate},{name:"state",value:c.state},{name:"company",value:c.company}]);
 const actual=new Set(rows.filter(r=>r.id.startsWith("tracking-")).map(r=>r.id.slice(9)));
 if(actual.size!==expected.length||expected.some(r=>!actual.has(r.id)))throw new Error("Tracking mismatch for "+JSON.stringify(c));
 const expectedAdjustments=await queryReadOnlyUncached<{id:string}>(`SELECT CAST(a.PayrollAdjustmentID AS varchar(30)) id FROM dbo.tblPayrollAdjustments a
 LEFT JOIN dbo.tblPullDownPayrollCoOnSite co ON co.PullDownPayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID
 WHERE a.EmployeeID IS NOT NULL AND a.WeekEndingDate>=@start AND a.WeekEndingDate<DATEADD(day,1,CAST(@end AS date))
 AND (@company='' OR co.PullDownPayrollCoOnSiteInitials=@company)
 AND (@state='' OR EXISTS(SELECT 1 FROM dbo.tblTracking t WHERE t.EmployeeID=a.EmployeeID AND t.PayrollCoOnSiteID=a.PayrollAdjustmentPayrollCoOnSiteID AND t.WeekEndingDate=a.WeekEndingDate AND t.SiteState=@state))`,
 [{name:"start",value:p.startDate},{name:"end",value:p.endDate},{name:"state",value:c.state},{name:"company",value:c.company}]);
 const actualAdjustments=new Set(rows.filter(r=>r.id.startsWith("adjustment-")).map(r=>r.id.slice(11)));
 if(actualAdjustments.size!==expectedAdjustments.length||expectedAdjustments.some(r=>!actualAdjustments.has(r.id)))throw new Error("Adjustment mismatch for "+JSON.stringify(c));
 results.push({...c,tracking:actual.size,adjustments:actualAdjustments.size,exactIdsMatch:true});
 }
 console.log(JSON.stringify(results));
 }finally{await closePool();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
