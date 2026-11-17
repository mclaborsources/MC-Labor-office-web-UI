import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface SalesmanReportRow {id:string;employeeId:string;weekEnding:string;values:(string|number)[]}
export async function getSalesmanReportRows(p:Record<string,string|undefined>):Promise<SalesmanReportRow[]>{
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select valid dates.");
 const scope=await getAccountingReportScope(p);
 const records=await queryReadOnly<{weekEnding:string;company:string;firstName:string;lastName:string;before:number;after:number}>(`SELECT CONVERT(varchar(10),cw.WeekEndingDate,101) weekEnding,
 ISNULL(co.PullDownContractWith_PayrollCoInitials,'') company,ISNULL(sm.PullDownSalesmanFName,'') firstName,ISNULL(sm.PullDownSalesmanLName,'') lastName,
 SUM(ISNULL(cw.InvoiceTotal,0)) before,SUM(ISNULL(cw.InvoiceTotal,0)+ISNULL(cw.InvoiceAdjustment,0))*0.8 after
 FROM ${scope.customerWeeks} cw
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=COALESCE(cw.CustomerWeekSalesmanID,c.SalesmanID)
 LEFT JOIN dbo.tblPullDownContractWith_PayrollCo co WITH (NOLOCK) ON co.PullDownContractWith_PayrollCoID=COALESCE(cw.CustomerWeekContractWith_PayrollCoID,c.CustContractWith_PayrollCoID)
 WHERE cw.WeekEndingDate>=CONVERT(date,@start,23) AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))

 GROUP BY cw.WeekEndingDate,co.PullDownContractWith_PayrollCoInitials,sm.PullDownSalesmanFName,sm.PullDownSalesmanLName
 ORDER BY cw.WeekEndingDate,company`,[...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany??""}]);
 const groups=new Map<string,SalesmanReportRow>();
 const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z]/g,"");
 for(const r of records){const id=r.weekEnding+"|"+r.company;let row=groups.get(id);if(!row){row={id,employeeId:"",weekEnding:r.weekEnding,values:[r.company,r.weekEnding,...Array(18).fill(0)]};groups.set(id,row);}
 row.values[2]=Number(row.values[2])+r.before;row.values[3]=Number(row.values[3])+r.after;
 const name=normalize(r.firstName+r.lastName);const index=name==="brianlupo"?4:name==="brianmcveigh"?6:name==="eamonohara"?8:name==="househouse"?10:name==="kevinhy"?12:name==="raymcveigh"?14:name==="ryanoneill"?16:name==="yg"?18:-1;
 if(index>=0){row.values[index]=Number(row.values[index])+r.before;row.values[index+1]=Number(row.values[index+1])+r.after;}
 }
 return [...groups.values()];
}
