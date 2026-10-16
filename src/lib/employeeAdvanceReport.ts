import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

/** Advance balance uses linked signed payroll adjustments; deductions reduce the advance. */
export function getEmployeeAdvanceReportRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`WITH repayments AS (
    SELECT EmployeeAdvanceID,SUM(ISNULL(PayrollAdjustmentAmount,0)) AS NetAdjustments,
      MAX(WeekEndingDate) AS UpToWeekEndingDate
    FROM dbo.tblPayrollAdjustments WITH (NOLOCK)
    WHERE EmployeeAdvanceID IS NOT NULL GROUP BY EmployeeAdvanceID
  )
  SELECT CAST(a.EmployeeAdvanceID AS NVARCHAR(20)) AS id,
    ISNULL(e.EmFirstName,'') AS [First Name],ISNULL(e.EmLastName,'') AS [Last Name],ISNULL(e.EmMiddle,'') AS MI,
    a.EmployeeAdvanceDate AS [Advance Date],a.EmployeeAdvanceAmount AS [Advance Amount],
    a.EmployeeAdvanceRepaymentAmount AS [Repayment Amount],
    a.EmployeeAdvanceStartRepaymentWeekEnding AS [Start Week Ending],
    ISNULL(a.EmployeeAdvanceNote,'') AS [Advance Note],ISNULL(a.EmployeeAdvanceUserName,'') AS [User Name],
    a.EmployeeAdvanceTimestamp AS Timestamp,
    ISNULL(a.EmployeeAdvanceAmount,0)+ISNULL(r.NetAdjustments,0) AS Balance,
    r.UpToWeekEndingDate AS [Up To Date]
  FROM dbo.tblEmployeeAdvances a WITH (NOLOCK)
  LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=a.EmployeeID
  LEFT JOIN repayments r ON r.EmployeeAdvanceID=a.EmployeeAdvanceID
  ORDER BY e.EmFirstName,e.EmLastName,a.EmployeeAdvanceDate,a.EmployeeAdvanceID`);
}
