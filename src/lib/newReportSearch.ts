import { queryReadOnly } from "@/lib/db/sql";
import type { TrackingWeekOption } from "@/lib/adminReportQueries";

export interface NewReportSearchRow {
  id: string;
  employeeId: string;
  payrollCompany: string;
  weekEnding: string;
  multiple: string;
  ssn: string;
  name: string;
  regularPayRate: number | null;
  regularRegHours: number | null;
  regularOtHours: number | null;
  regularPayAmount: number;
  juryDutyRate: number | null;
  juryDutyRegHours: number | null;
  juryDutyAmount: number | null;
  retroRate: number | null;
  retroRegHours: number | null;
  retroAmount: number | null;
  advanceRepayment: number;
}

export function getNewReportSearchWeeks(): Promise<TrackingWeekOption[]> {
  return queryReadOnly<TrackingWeekOption>(`SELECT DISTINCT CONVERT(VARCHAR(10),WeekEndingDate,23) AS value,
    CONVERT(VARCHAR(10),WeekEndingDate,101) AS label FROM dbo.tblTracking WITH (NOLOCK)
    WHERE WeekEndingDate IS NOT NULL ORDER BY value DESC`);
}

export function getNewReportSearchCompanies(): Promise<string[]> {
  return queryReadOnly<{ label: string }>(`SELECT DISTINCT ISNULL(PayrollCoOnSiteInitials,'') AS label
    FROM dbo.tblTracking WITH (NOLOCK) WHERE NULLIF(LTRIM(RTRIM(ISNULL(PayrollCoOnSiteInitials,''))),'') IS NOT NULL
    ORDER BY label`).then((rows) => rows.map((row) => row.label.trim()));
}

/** Read each employee/job tracking entry for the selected payroll week. */
export function getNewReportSearchRows(weekEnding: string): Promise<NewReportSearchRow[]> {
  return queryReadOnly<NewReportSearchRow>(`SELECT TOP (5000)
    CAST(t.TrackingID AS NVARCHAR(30)) AS id,
    CAST(t.EmployeeID AS NVARCHAR(30)) AS employeeId,
    ISNULL(t.PayrollCoOnSiteInitials,'') AS payrollCompany,
    CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS weekEnding,
    CASE WHEN COUNT(*) OVER (PARTITION BY t.EmployeeID) > 1 THEN 'X' ELSE '' END AS multiple,
    CASE WHEN LEN(LTRIM(RTRIM(ISNULL(e.SSNum,''))))>=4 THEN CONCAT('***-**-',RIGHT(LTRIM(RTRIM(e.SSNum)),4)) ELSE '' END AS ssn,
    LTRIM(RTRIM(CONCAT(ISNULL(t.EmFirstName,''),CASE WHEN NULLIF(t.EmMiddle,'') IS NULL THEN '' ELSE CONCAT(' ',LEFT(t.EmMiddle,1)) END,
      CASE WHEN NULLIF(t.EmLastName,'') IS NULL THEN '' ELSE CONCAT(' ',t.EmLastName) END))) AS name,
    t.PayRate AS regularPayRate,ISNULL(t.RegularHours,0) AS regularRegHours,ISNULL(t.OvertimeHours,0) AS regularOtHours,
    CAST(CASE WHEN ISNULL(t.EmGrossPayroll,0)<>0 THEN t.EmGrossPayroll
      ELSE ISNULL(t.PayRate,0)*ISNULL(t.RegularHours,0)+ISNULL(t.OTPayRate,0)*ISNULL(t.OvertimeHours,0) END AS DECIMAL(12,2)) AS regularPayAmount,
    CAST(NULL AS DECIMAL(12,2)) AS juryDutyRate,CAST(NULL AS DECIMAL(12,2)) AS juryDutyRegHours,
    CAST(NULL AS DECIMAL(12,2)) AS juryDutyAmount,CAST(NULL AS DECIMAL(12,2)) AS retroRate,
    CAST(NULL AS DECIMAL(12,2)) AS retroRegHours,CAST(NULL AS DECIMAL(12,2)) AS retroAmount,
    ISNULL(repayments.amount,0) AS advanceRepayment
  FROM dbo.tblTracking t WITH (NOLOCK)
  LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=t.EmployeeID
  OUTER APPLY (SELECT SUM(ISNULL(pa.PayrollAdjustmentAmount,0)) AS amount
    FROM dbo.tblPayrollAdjustments pa WITH (NOLOCK)
    JOIN dbo.tblEmployeeAdvances a WITH (NOLOCK) ON a.EmployeeAdvanceID=pa.EmployeeAdvanceID
    WHERE a.EmployeeID=t.EmployeeID AND pa.PayrollAdjustmentPayrollCoOnSiteID=t.PayrollCoOnSiteID
      AND pa.WeekEndingDate>=CONVERT(date,@weekEnding,23)
      AND pa.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))) repayments
  WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23)
    AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
    AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
  ORDER BY t.PayrollCoOnSiteInitials,t.EmLastName,t.EmFirstName,t.TrackingID`, [{ name: "weekEnding", value: weekEnding }]);
}
