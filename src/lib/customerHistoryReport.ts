import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface CustomerHistoryRow {id:string;customerId:string;customer:string;weekEnding:string;job:string;firstName:string;middle:string;lastName:string;sat:number|null;sun:number|null;mon:number|null;tue:number|null;wed:number|null;thu:number|null;fri:number|null;satFlag?:number|null;sunFlag?:number|null;monFlag?:number|null;tueFlag?:number|null;wedFlag?:number|null;thuFlag?:number|null;friFlag?:number|null;totalHours:number;payRate:number;payroll:number;invoice:number;weekHours:number;weekInvoice:number;customerHours:number;customerInvoice:number}
export async function getCustomerHistoryRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<CustomerHistoryRow>(`WITH history AS (
 SELECT CAST(t.TrackingID AS varchar(30)) id,CAST(t.CustomerID AS varchar(30)) customerId,ISNULL(t.CustomerBusName,'') customer,
 CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,ISNULL(t.SiteName,'') job,
 ISNULL(t.EmFirstName,'') firstName,ISNULL(t.EmMiddle,'') middle,ISNULL(t.EmLastName,'') lastName,
 t.SatHours sat,t.SunHours sun,t.MonHours mon,t.TueHours tue,t.WedHours wed,t.ThuHours thu,t.FriHours fri,
 t.SatStatusFlagID satFlag,t.SunStatusFlagID sunFlag,t.MonStatusFlagID monFlag,t.TueStatusFlagID tueFlag,t.WedStatusFlagID wedFlag,t.ThuStatusFlagID thuFlag,t.FriStatusFlagID friFlag,
 ISNULL(t.TotalHours,0) totalHours,ISNULL(t.PayRate,0) payRate,
 ISNULL(t.EmGrossPayroll,ISNULL(t.RegularHours,0)*ISNULL(t.PayRate,0)+ISNULL(t.OvertimeHours,0)*ISNULL(t.OTPayRate,0)) payroll,
 ISNULL(t.InvoiceAmount,0) invoice
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN ${scope.customerWeeks} cw ON cw.CustomerID=t.CustomerID AND cw.WeekEndingDate=t.WeekEndingDate
 LEFT JOIN dbo.tblPullDownContractWith_PayrollCo co WITH (NOLOCK) ON co.PullDownContractWith_PayrollCoID=COALESCE(cw.CustomerWeekContractWith_PayrollCoID,c.CustContractWith_PayrollCoID)
 WHERE t.CustomerID IS NOT NULL AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@customer='' OR t.CustomerID=TRY_CONVERT(int,@customer))
 AND (@contract='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@contract,',') contractChoice WHERE LTRIM(RTRIM(contractChoice.value))=co.PullDownContractWith_PayrollCoInitials))
 )
 SELECT *,SUM(totalHours) OVER(PARTITION BY customerId,weekEnding) weekHours,
 SUM(invoice) OVER(PARTITION BY customerId,weekEnding) weekInvoice,
 SUM(totalHours) OVER(PARTITION BY customerId) customerHours,
 SUM(invoice) OVER(PARTITION BY customerId) customerInvoice
 FROM history ORDER BY customer,CONVERT(date,weekEnding,101),job,lastName,firstName,id`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"customer",value:p.customer||""},{name:"contract",value:p.contractWith||""}]);
}
