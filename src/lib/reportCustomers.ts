import { queryReadOnly } from "@/lib/db/sql";
export interface ReportCustomer { id:string; customer:string; lastWeek:string; state:string; email:string; phone:string }
export async function getReportCustomers():Promise<ReportCustomer[]> {
  return queryReadOnly<ReportCustomer>(`SELECT CAST(c.CustomerID AS NVARCHAR(20)) id, ISNULL(c.CustBusName,'') customer, ISNULL(c.State,'') state, ISNULL(c.CustEmail,'') email, ISNULL(c.Phone,'') phone, CONVERT(VARCHAR(10), t.LastWeek, 23) lastWeek FROM tblCustomer c WITH (NOLOCK) INNER JOIN (SELECT CustomerID, MAX(WeekEndingDate) LastWeek FROM tblTracking WITH (NOLOCK) GROUP BY CustomerID) t ON t.CustomerID=c.CustomerID WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName,''))))>1 ORDER BY c.CustBusName`);
}
