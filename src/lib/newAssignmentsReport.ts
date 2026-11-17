import {getAccountingReportScope} from "@/lib/accountingReportScope";
import {queryReadOnly} from "@/lib/db/sql";
import {payrollDate} from "@/lib/wccPayrollReport";
export interface AssignmentReportRow {id:string;employeeId:string;weekEnding:string;values:(string|number)[]}
export async function getNewAssignmentRows(p:Record<string,string|undefined>):Promise<AssignmentReportRow[]>{
 const start=payrollDate(p.startDate)||payrollDate(p.weekEnding),end=payrollDate(p.endDate)||payrollDate(p.weekEnding);
 if(!start||!end||start>end)throw new Error("Select valid dates.");
 const scope=await getAccountingReportScope(p);
 const data=await queryReadOnly<Record<string,unknown>>(`WITH targets AS (
 SELECT t.* FROM ${scope.tracking} t
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 ), employeeWeeks AS (
 SELECT p.EmployeeID,p.WeekEndingDate,SUM(ISNULL(p.TotalHours,0)) hours
 FROM dbo.tblTracking p WITH (NOLOCK)
 WHERE p.ExpenseTypeID IS NULL AND p.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND p.EmployeeID IS NOT NULL
 GROUP BY p.EmployeeID,p.WeekEndingDate
 ), history AS (
 SELECT EmployeeID,WeekEndingDate,
 LAG(WeekEndingDate) OVER(PARTITION BY EmployeeID ORDER BY WeekEndingDate) previousWeek,
 MIN(WeekEndingDate) OVER(PARTITION BY EmployeeID ORDER BY WeekEndingDate ROWS UNBOUNDED PRECEDING) firstWeek,
 SUM(hours) OVER(PARTITION BY EmployeeID ORDER BY WeekEndingDate ROWS UNBOUNDED PRECEDING) totalHours,
 SUM(hours) OVER(PARTITION BY EmployeeID ORDER BY WeekEndingDate ROWS UNBOUNDED PRECEDING)/NULLIF(COUNT(*) OVER(PARTITION BY EmployeeID ORDER BY WeekEndingDate ROWS UNBOUNDED PRECEDING)*1.0,0) averageHours
 FROM employeeWeeks
 )
 SELECT t.TrackingID,t.EmployeeID,t.EmFirstName,t.EmMiddle,t.EmLastName,t.GradeChange,t.Grade,
 CONVERT(varchar(10),h.firstWeek,101) firstWeek,CONVERT(varchar(10),t.WeekEndingDate,101) weekEnding,
 h.totalHours,h.averageHours,CASE WHEN h.previousWeek IS NULL THEN 0 ELSE DATEDIFF(day,h.previousWeek,t.WeekEndingDate)/7-1 END weeksAway,
 CASE WHEN h.previousWeek IS NULL THEN 1 ELSE 0 END newEmployee,t.CustomerBusName,t.AssignmentUserName,
 CONVERT(varchar(10),t.AssignmentTimestamp,101) assignmentDate,t.JobApplicationStatusDesc,
 LTRIM(RTRIM(CONCAT(sm.PullDownSalesmanFName,' ',sm.PullDownSalesmanLName))) salesman
 FROM targets t
 JOIN history h ON h.EmployeeID=t.EmployeeID AND h.WeekEndingDate=t.WeekEndingDate
 LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
 LEFT JOIN dbo.tblPullDownSalesman sm WITH (NOLOCK) ON sm.PullDownSalesmanID=c.SalesmanID
 WHERE t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
 AND t.WeekEndingDate>=CONVERT(date,@start,23) AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@end,23))
 AND (h.previousWeek IS NULL OR DATEDIFF(day,h.previousWeek,t.WeekEndingDate)>7)
 ORDER BY t.WeekEndingDate,t.EmLastName,t.EmFirstName,t.TrackingID OPTION (RECOMPILE)`,[...scope.params,{name:"start",value:start},{name:"end",value:end}]);
 const s=(v:unknown)=>String(v??"");
 return data.map(r=>({id:s(r.TrackingID),employeeId:s(r.EmployeeID),weekEnding:s(r.weekEnding),values:[s(r.EmFirstName),s(r.EmMiddle),s(r.EmLastName),s(r.GradeChange),"","",s(r.Grade),s(r.firstWeek),Number(r.averageHours||0),Number(r.totalHours||0),s(r.weekEnding),Number(r.weeksAway||0),s(r.CustomerBusName),s(r.AssignmentUserName),s(r.assignmentDate),s(r.salesman),s(r.JobApplicationStatusDesc),r.newEmployee?1:"",1,Number(r.weeksAway)>0?1:""]}));
}
