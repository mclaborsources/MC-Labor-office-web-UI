import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface SalesByCustomerRow {id:string;customer:string;company:string;state:string;customerType:string;customerSince:string;salesman:string;totalSales:number;perDiem:number;subSales:number;employeeSales:number}
export async function getSalesByCustomerRows(p:Record<string,string|undefined>,byState=false){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<SalesByCustomerRow>(`SELECT CONCAT(t.CustomerID,'|',CASE WHEN @byState=1 THEN ISNULL(t.SiteState,'') ELSE '' END,'|',CASE WHEN @byState=1 THEN ISNULL(t.PayrollCoOnSiteInitials,'') ELSE '' END) id,
 ISNULL(c.CustBusName,MAX(t.CustomerBusName)) customer, CASE WHEN @byState=1 THEN ISNULL(t.PayrollCoOnSiteInitials,'') ELSE '' END company,
 CASE WHEN @byState=1 THEN ISNULL(t.SiteState,'') ELSE '' END state,
 ISNULL(ct.PullDownCustomerType,'') customerType,CONVERT(varchar(10),cs.firstWeek,101) customerSince,
 LTRIM(RTRIM(CONCAT(sm.PullDownSalesmanFName,' ',sm.PullDownSalesmanLName))) salesman,
 SUM(ISNULL(t.InvoiceAmount,0)) totalSales,
 SUM(CASE WHEN t.ExpenseType='Per Diem' THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) perDiem,
 SUM(CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(t.JobApplicationStatusDesc,''))))='SUB' THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) subSales,
 SUM(CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(t.JobApplicationStatusDesc,''))))<>'SUB' AND ISNULL(t.ExpenseType,'')<>'Per Diem' THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) employeeSales
 FROM ${scope.tracking} t
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 OUTER APPLY (SELECT MIN(cw.WeekEndingDate) firstWeek FROM dbo.tblCustomerWeeks cw WITH (NOLOCK) WHERE cw.CustomerID=t.CustomerID) cs
 LEFT JOIN dbo.tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 WHERE t.CustomerID IS NOT NULL AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials))
 AND (@states='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@states,',') s WHERE LTRIM(RTRIM(s.value))=t.SiteState))
 GROUP BY t.CustomerID,c.CustBusName,ct.PullDownCustomerType,cs.firstWeek,sm.PullDownSalesmanFName,sm.PullDownSalesmanLName,CASE WHEN @byState=1 THEN ISNULL(t.SiteState,'') ELSE '' END,CASE WHEN @byState=1 THEN ISNULL(t.PayrollCoOnSiteInitials,'') ELSE '' END
 ORDER BY customer,state DESC,company`,[...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"states",value:p.state||""},{name:"byState",value:byState?1:0}]);
}
