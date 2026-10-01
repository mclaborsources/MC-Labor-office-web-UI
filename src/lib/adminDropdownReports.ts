import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

/** Data-backed invoice search using the confirmed tblCustomerWeeks invoice fields. */
export function getInvoiceSearchRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (2000)
    CAST(cw.CustomerWeekID AS NVARCHAR(20)) AS id,
    ISNULL(c.CustBusName,'') AS Customer,
    CONVERT(VARCHAR(10),cw.WeekEndingDate,101) AS [Week Ending],
    ISNULL(cw.InvoiceNum,'') AS Invoice,
    ISNULL(cw.InvoiceTotal,0) AS Total,
    LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName,'')+' '+ISNULL(s.PullDownSalesmanLName,''))) AS Salesman,
    ISNULL(cw.OpenBalance,0) AS [Open Balance],
    CASE WHEN cw.Paid<>0 THEN 'Yes' ELSE 'No' END AS Paid
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
  LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
  ORDER BY cw.WeekEndingDate DESC,c.CustBusName`);
}

/** Employee assignment/contact fields confirmed by the tracking and employee data modules. */
export function getEmailAddressRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`WITH ranked AS (
    SELECT t.TrackingID,t.CustomerBusName,t.SiteName,t.EmFirstName,t.EmLastName,t.EmMobilePhone,
      t.WeekEndingDate,t.PayrollCoOnSiteInitials,e.EmEmail,t.AssignmentUserName,
      ROW_NUMBER() OVER (PARTITION BY t.EmployeeID ORDER BY t.AssignmentTimestamp DESC,t.TrackingID DESC) rn
    FROM tblTracking t WITH (NOLOCK)
    LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
    WHERE t.EmployeeID IS NOT NULL
  )
  SELECT TOP (1000) CAST(TrackingID AS NVARCHAR(20)) id,
    ISNULL(CustomerBusName,'') Customer,ISNULL(SiteName,'') Job,
    ISNULL(EmFirstName,'') AS [Em First Name],ISNULL(EmLastName,'') AS [Em Last Name],
    ISNULL(EmMobilePhone,'') Cell,CONVERT(VARCHAR(10),WeekEndingDate,101) AS [Week Ending],
    ISNULL(PayrollCoOnSiteInitials,'') AS [Payroll Co],ISNULL(EmEmail,'') Email,
    ISNULL(AssignmentUserName,'') Assignment
  FROM ranked WHERE rn=1 ORDER BY EmLastName,EmFirstName`);
}

/** Weekly/monthly employee hours aggregated from the confirmed tracking hour columns. */
export function getEmployeeHoursRows(mode: "week" | "month", year: number): Promise<OperationalReportRow[]> {
  const period = mode === "week" ? "AssignWeek" : "MONTH(WeekEndingDate)";
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (3000)
    CONCAT(CAST(EmployeeID AS NVARCHAR(20)),'-',ISNULL(PayrollCoOnSiteInitials,'')) id,
    MAX(ISNULL(EmFirstName,'')) AS [First Name],MAX(ISNULL(EmLastName,'')) AS [Last Name],
    MAX(ISNULL(EmMiddle,'')) MI,ISNULL(PayrollCoOnSiteInitials,'') AS [Payroll Co],
    ${period} AS Period,
    SUM(ISNULL(SatHours,0)+ISNULL(SunHours,0)+ISNULL(MonHours,0)+ISNULL(TueHours,0)+ISNULL(WedHours,0)+ISNULL(ThuHours,0)+ISNULL(FriHours,0)) AS [Hours]
  FROM tblTracking WITH (NOLOCK)
  WHERE EmployeeID IS NOT NULL AND AssignYear=@year AND WeekEndingDate IS NOT NULL
  GROUP BY EmployeeID,PayrollCoOnSiteInitials,${period}
  ORDER BY [Last Name],[First Name],Period`, [{ name: "year", value: year }]);
}

export function getYearlyRevenueRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT TOP (3000)
    CAST(c.CustomerID AS NVARCHAR(20)) id,ISNULL(c.CustBusName,'') Customer,
    ISNULL(c.Street,'') Street,ISNULL(c.City,'') City,ISNULL(c.State,'') State,
    ISNULL(ct.PullDownCustomerType,'') AS [Customer Type],YEAR(cw.WeekEndingDate) AS [Revenue Year],
    SUM(ISNULL(cw.InvoiceTotal,0)) AS [Revenue]
  FROM tblCustomerWeeks cw WITH (NOLOCK)
  JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
  LEFT JOIN tblPullDownCustomerTypes ct WITH (NOLOCK) ON ct.PullDownCustomerTypeID=c.CustomerTypeID
  WHERE cw.WeekEndingDate IS NOT NULL
  GROUP BY c.CustomerID,c.CustBusName,c.Street,c.City,c.State,ct.PullDownCustomerType,YEAR(cw.WeekEndingDate)
  ORDER BY [Revenue Year] DESC,Customer`);
}
