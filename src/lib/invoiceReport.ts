import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface InvoiceReportRow {id:string;customer:string;date:string;number:string;contract:string;amount:number}
export async function getInvoiceReportRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<InvoiceReportRow>(`SELECT CAST(cw.CustomerWeekID AS varchar(30)) id,ISNULL(c.CustBusName,'') customer,
 CONVERT(varchar(10),cw.WeekEndingDate,101) date,ISNULL(CAST(cw.InvoiceNum AS varchar(50)),'') number,
 ISNULL(co.PullDownContractWith_PayrollCoInitials,'') contract,ISNULL(cw.InvoiceTotal,0) amount
 FROM ${scope.customerWeeks} cw
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
 LEFT JOIN dbo.tblPullDownContractWith_PayrollCo co WITH (NOLOCK) ON co.PullDownContractWith_PayrollCoID=COALESCE(cw.CustomerWeekContractWith_PayrollCoID,c.CustContractWith_PayrollCoID)
 WHERE cw.WeekEndingDate>=CONVERT(date,@start,23) AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND NULLIF(LTRIM(RTRIM(CAST(cw.InvoiceNum AS varchar(50)))),'') IS NOT NULL
 AND (@customer='' OR cw.CustomerID=TRY_CONVERT(int,@customer))
 AND (@contract='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@contract,',') contractChoice WHERE LTRIM(RTRIM(contractChoice.value))=co.PullDownContractWith_PayrollCoInitials))
 ORDER BY c.CustBusName,cw.WeekEndingDate,cw.InvoiceNum,cw.CustomerWeekID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"customer",value:p.customer||""},{name:"contract",value:p.contractWith||""}]);
}
