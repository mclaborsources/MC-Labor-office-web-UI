import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface SalesmanWeeklyRow {id:string;weekEnding:string;contract:string;customer:string;salesman:string;margin:number;invoice:number;adjustment:number;payment:number}
export async function getSalesmanWeeklyRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<SalesmanWeeklyRow>(`SELECT CAST(cw.CustomerWeekID AS varchar(30)) id,CONVERT(varchar(10),cw.WeekEndingDate,101) weekEnding,
 ISNULL(co.PullDownContractWith_PayrollCoInitials,'') contract,ISNULL(c.CustBusName,'') customer,
 LTRIM(RTRIM(CONCAT(sm.PullDownSalesmanFName,' ',sm.PullDownSalesmanLName))) salesman,
 ISNULL(tr.margin,0) margin,ISNULL(cw.InvoiceTotal,0) invoice,ISNULL(cw.InvoiceAdjustment,0) adjustment,ISNULL(cw.Paid,0) payment
 FROM ${scope.customerWeeks} cw
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=COALESCE(cw.CustomerWeekSalesmanID,c.SalesmanID)
 LEFT JOIN dbo.tblPullDownContractWith_PayrollCo co WITH (NOLOCK) ON co.PullDownContractWith_PayrollCoID=COALESCE(cw.CustomerWeekContractWith_PayrollCoID,c.CustContractWith_PayrollCoID)
 OUTER APPLY(SELECT SUM(ISNULL(t.WccTrackingProfit,0)) margin FROM ${scope.tracking} t
 WHERE t.CustomerID=cw.CustomerID AND t.WeekEndingDate=cw.WeekEndingDate) tr
 WHERE cw.WeekEndingDate>=CONVERT(date,@start,23) AND cw.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@year='' OR cw.AssignYear=TRY_CONVERT(int,@year))
 AND (@contract='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@contract,',') contractChoice WHERE LTRIM(RTRIM(contractChoice.value))=co.PullDownContractWith_PayrollCoInitials))
 AND (@salesman='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@salesman,',') salesmanChoice WHERE TRY_CONVERT(int,LTRIM(RTRIM(salesmanChoice.value)))=sm.PullDownSalesmanID))
 AND (@states='' OR EXISTS(SELECT 1 FROM ${scope.tracking} t JOIN STRING_SPLIT(@states,',') s ON LTRIM(RTRIM(s.value))=t.SiteState WHERE t.CustomerID=cw.CustomerID AND t.WeekEndingDate=cw.WeekEndingDate))
 ORDER BY cw.WeekEndingDate,c.CustBusName,cw.CustomerWeekID`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"year",value:p.assignYear||""},{name:"contract",value:p.contractWith||""},{name:"salesman",value:p.salesman||""},{name:"states",value:""}]);
}
