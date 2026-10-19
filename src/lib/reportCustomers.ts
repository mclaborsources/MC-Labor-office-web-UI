import { queryReadOnly } from "@/lib/db/sql";
export interface ReportCustomer { id:string; customer:string; lastWeek:string; trackingStatus?:"New"|"Existing"|"Returning"; state:string; email:string; phone:string }
export async function getReportCustomers(weekEnding:string):Promise<ReportCustomer[]> {
  return queryReadOnly<ReportCustomer>(`WITH currentCustomers AS (
    SELECT CustomerID FROM tblTracking WITH (NOLOCK)
    WHERE WeekEndingDate=CONVERT(date,@weekEnding,23)
    GROUP BY CustomerID
  ), previousTracking AS (
    SELECT t.CustomerID,MAX(t.WeekEndingDate) LastWeek
    FROM tblTracking t WITH (NOLOCK)
    INNER JOIN currentCustomers c ON c.CustomerID=t.CustomerID
    WHERE t.WeekEndingDate<CONVERT(date,@weekEnding,23)
    GROUP BY t.CustomerID
  )
  SELECT CAST(c.CustomerID AS NVARCHAR(20)) id,ISNULL(c.CustBusName,'') customer,
    COALESCE(CONVERT(VARCHAR(10),p.LastWeek,23),'') lastWeek,
    CASE WHEN p.LastWeek IS NULL THEN 'New'
      WHEN p.LastWeek=DATEADD(day,-7,CONVERT(date,@weekEnding,23)) THEN 'Existing'
      ELSE 'Returning' END trackingStatus,
    ISNULL(c.State,'') state,ISNULL(c.CustEmail,'') email,ISNULL(c.Phone,'') phone
  FROM currentCustomers active
  INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=active.CustomerID
  LEFT JOIN previousTracking p ON p.CustomerID=c.CustomerID
  WHERE LEN(LTRIM(RTRIM(ISNULL(c.CustBusName,''))))>1
  ORDER BY c.CustBusName`,[{name:"weekEnding",value:weekEnding}]);
}
