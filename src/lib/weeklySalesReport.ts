import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
type AddedSalesKey = `${"murphy"|"eamon"|"house"|"ronTotal"|"eohTotal"|"ray"|"ryan"|"tj"|"yg"}${"Before"|"After"}`;
export type WeeklySalesRow = Record<AddedSalesKey,number|null> & {id:string;week:number;year:number;weekEnding:string;totalSales:number;perDiem:number;subSales:number;employeeSales:number;adjustedAfter20:number;ronBefore:number;ronAfter:number;kevinBefore:number;kevinAfter:number;brianBefore:number;brianAfter:number;mcveighBefore:number;mcveighAfter:number}
export async function getWeeklySalesRows(p:Record<string,string|undefined>){
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select a valid date range.");
 const scope=await getAccountingReportScope(p);
 return queryReadOnly<WeeklySalesRow>(`WITH work AS (
 SELECT t.CustomerID,t.PayrollCoOnSiteID,CAST(t.WeekEndingDate AS date) weekEnding,MAX(t.AssignWeek) week,MAX(t.AssignYear) year,
 SUM(ISNULL(t.InvoiceAmount,0)) totalSales,SUM(ISNULL(t.WccTrackingProfit,0)) totalProfit,
 SUM(CASE WHEN t.ExpenseTypeID IN (1,2,3) THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) perDiem,
 SUM(CASE WHEN t.ExpenseTypeID IS NULL AND ISNULL(t.JobApplicationStatusDesc,'')<>'SUB' THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) employeeSales,
 SUM(CASE WHEN t.ExpenseTypeID IS NULL AND ISNULL(t.JobApplicationStatusDesc,'')='SUB' THEN ISNULL(t.InvoiceAmount,0) ELSE 0 END) subSales
 FROM ${scope.tracking} t
 WHERE t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (@company='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@company,',') pcChoice WHERE LTRIM(RTRIM(pcChoice.value))=t.PayrollCoOnSiteInitials))
 AND (@year='' OR t.AssignYear=TRY_CONVERT(int,@year))
 AND (@states='' OR EXISTS(SELECT 1 FROM STRING_SPLIT(@states,',') s WHERE LTRIM(RTRIM(s.value))=t.SiteState))
 GROUP BY t.CustomerID,t.PayrollCoOnSiteID,CAST(t.WeekEndingDate AS date)
 ), weekly AS (
 SELECT w.*,CASE WHEN w.totalSales<>0 AND w.totalProfit/w.totalSales<0.2 THEN 5*w.totalProfit ELSE w.totalSales END adjustedSales,
 ISNULL(sm.PullDownSalesmanFName,'') firstName,ISNULL(sm.PullDownSalesmanLName,'') lastName
 FROM work w LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=w.CustomerID
 LEFT JOIN ${scope.customerWeeks} cw ON cw.CustomerID=w.CustomerID AND cw.WeekEndingDate=w.weekEnding
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=COALESCE(cw.CustomerWeekSalesmanID,c.SalesmanID)
 )
 SELECT CONVERT(varchar(10),weekEnding,23) id,MAX(week) week,MAX(year) year,CONVERT(varchar(10),weekEnding,101) weekEnding,
 SUM(totalSales) totalSales,SUM(perDiem) perDiem,SUM(subSales) subSales,SUM(employeeSales) employeeSales,
 SUM(adjustedSales) adjustedAfter20,
 SUM(CASE WHEN firstName IN ('Ron','Ronald') THEN totalSales ELSE 0 END) ronBefore,
 SUM(CASE WHEN firstName IN ('Ron','Ronald') THEN adjustedSales ELSE 0 END) ronAfter,
 SUM(CASE WHEN firstName='Kevin' AND lastName LIKE 'Hy%' THEN totalSales ELSE 0 END) kevinBefore,
 SUM(CASE WHEN firstName='Kevin' AND lastName LIKE 'Hy%' THEN adjustedSales ELSE 0 END) kevinAfter,
 SUM(CASE WHEN firstName='Brian' AND lastName='Lupo' THEN totalSales ELSE 0 END) brianBefore,
 SUM(CASE WHEN firstName='Brian' AND lastName='Lupo' THEN adjustedSales ELSE 0 END) brianAfter,
 SUM(CASE WHEN firstName='Brian' AND REPLACE(lastName,' ','')='McVeigh' THEN totalSales ELSE 0 END) mcveighBefore,
 SUM(CASE WHEN firstName='Brian' AND REPLACE(lastName,' ','')='McVeigh' THEN adjustedSales ELSE 0 END) mcveighAfter
 ,${[
 ["murphy", "firstName='Brian' AND lastName='Murphy'"],
 ["eamon", "firstName='Eamon' AND REPLACE(lastName,CHAR(39),'')='OHara'"],
 ["house", "firstName='House' AND lastName='House'"],
 ["ray", "firstName='Ray' AND REPLACE(lastName,' ','')='McVeigh'"],
 ["ryan", "firstName='Ryan' AND REPLACE(lastName,CHAR(39),'')='ONeill'"],
 ["tj", "REPLACE(REPLACE(firstName,'.',''),' ','')='TJ' AND lastName='Kannel'"],
 ["yg", "firstName='Y' AND lastName='G'"],
 ].map(([key,condition])=>`SUM(CASE WHEN ${condition} THEN totalSales ELSE 0 END) ${key}Before, SUM(CASE WHEN ${condition} THEN adjustedSales ELSE 0 END) ${key}After`).join(",")},
 SUM(CASE WHEN ((firstName='Ryan' AND REPLACE(lastName,CHAR(39),'')='ONeill') OR (firstName='Ray' AND REPLACE(lastName,' ','')='McVeigh') OR (firstName='Brian' AND lastName='Lupo')) THEN totalSales ELSE 0 END) ronTotalBefore,SUM(CASE WHEN ((firstName='Ryan' AND REPLACE(lastName,CHAR(39),'')='ONeill') OR (firstName='Ray' AND REPLACE(lastName,' ','')='McVeigh') OR (firstName='Brian' AND lastName='Lupo')) THEN adjustedSales ELSE 0 END) ronTotalAfter,
 SUM(CASE WHEN ((firstName='Eamon' AND REPLACE(lastName,CHAR(39),'')='OHara') OR (firstName='House' AND lastName='House')) THEN totalSales ELSE 0 END) eohTotalBefore,SUM(CASE WHEN ((firstName='Eamon' AND REPLACE(lastName,CHAR(39),'')='OHara') OR (firstName='House' AND lastName='House')) THEN adjustedSales ELSE 0 END) eohTotalAfter
 FROM weekly GROUP BY weekEnding ORDER BY weekEnding`,
 [...scope.params,{name:"start",value:start},{name:"end",value:end},{name:"company",value:p.payrollCompany||""},{name:"year",value:p.assignYear||""},{name:"states",value:p.state||""}]);
}
