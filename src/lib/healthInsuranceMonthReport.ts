import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

export function getHealthInsuranceReportYears(): Promise<number[]> {
  return queryReadOnly<{ YearNum: number }>(`SELECT DISTINCT AssignYear AS YearNum
    FROM tblCustomerWeeks WITH (NOLOCK)
    WHERE AssignYear IS NOT NULL
    ORDER BY AssignYear DESC`).then(rows => rows.map(row => Number(row.YearNum)).filter(Number.isFinite));
}

const monthColumns = Array.from({ length: 12 }, (_, index) => index + 1).flatMap(month => {
  const mm = String(month).padStart(2, "0");
  return [
    `SUM(CASE WHEN MonthNum=${month} THEN CompanyCost END) AS MonthCost${mm}`,
    `SUM(CASE WHEN MonthNum=${month} THEN EmployeeCost END) AS MonthCost${mm}Employee`,
    `MAX(CASE WHEN MonthNum=${month} THEN Cobra END) AS Cobra${mm}`,
  ];
});

export function getHealthInsuranceMonthRows(year: number): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`WITH year_health AS (
    SELECT h.EmployeeID,MAX(h.EmployeeHealthInsuranceDate) AS MaxHealthInsuranceDate
    FROM tblEmployeeHealthInsurance h WITH (NOLOCK)
    WHERE h.AssignYear=@year
    GROUP BY h.EmployeeID
  ), monthly AS (
    SELECT h.EmployeeID,MONTH(h.WeekEndingDate) AS MonthNum,
      SUM(ISNULL(h.EmployeeHealthInsuranceCost,0)) AS CompanyCost,
      SUM(ISNULL(h.EmployeeHealthInsuranceCostEmployee,0)) AS EmployeeCost,
      MAX(CASE WHEN ISNULL(h.EmployeeHealthInsuranceCobra,0)<>0 THEN 1 ELSE 0 END) AS Cobra
    FROM tblEmployeeHealthInsurance h WITH (NOLOCK)
    WHERE h.AssignYear=@year AND h.WeekEndingDate IS NOT NULL
    GROUP BY h.EmployeeID,MONTH(h.WeekEndingDate)
  ), monthly_pivot AS (
    SELECT EmployeeID,${monthColumns.join(",\n      ")}
    FROM monthly GROUP BY EmployeeID
  ), last_week AS (
    SELECT EmployeeID,MAX(WeekEndingDate) AS LastWeekEndingDate
    FROM tblTracking WITH (NOLOCK)
    WHERE AssignYear=@year AND WeekEndingDate IS NOT NULL
    GROUP BY EmployeeID
  )
  SELECT CAST(e.EmployeeID AS NVARCHAR(20)) AS id,
    e.EmFirstName AS [First Name],e.EmMiddle AS MI,e.EmLastName AS [Last Name],
    CASE WHEN NULLIF(e.EmployeeFolder,'') IS NOT NULL THEN 'Emp Folder' ELSE '' END AS Folder,
    lw.LastWeekEndingDate AS [Last Week],
    e.BaseSalary AS [Pay Rate],e.CoExpHealthInsPerHr AS [Co Exp],e.HealthInsuranceCost AS [C Current],
    ISNULL(p.MonthCost01,0)+ISNULL(p.MonthCost02,0)+ISNULL(p.MonthCost03,0)+ISNULL(p.MonthCost04,0)+
    ISNULL(p.MonthCost05,0)+ISNULL(p.MonthCost06,0)+ISNULL(p.MonthCost07,0)+ISNULL(p.MonthCost08,0)+
    ISNULL(p.MonthCost09,0)+ISNULL(p.MonthCost10,0)+ISNULL(p.MonthCost11,0)+ISNULL(p.MonthCost12,0) AS [Total Cost],
    e.HealthInsuranceStartDate AS [C Start Date],
    e.HealthInsuranceCobraStartDate AS [Cobra Start Date],
    e.HealthInsuranceStartDateEmployee AS [E Start Date],e.HealthInsuranceEndDate AS [End Date],
    ISNULL(ep.EmployeePayrollCoOnSiteHealthInsuranceNotes,'') AS [Health Insurance Notes],
    ISNULL(hi.PullDownHealthInsuranceDesc,'') AS [Health Ins],
    ISNULL(flag.PullDownHealthInsuranceFlag,'') AS [Insurance Flag],
    e.HealthInsuranceTurnOffAlarm AS [Turn Off Alarm],yh.MaxHealthInsuranceDate,
    p.MonthCost01,p.MonthCost02,p.MonthCost03,p.MonthCost04,p.MonthCost05,p.MonthCost06,
    p.MonthCost07,p.MonthCost08,p.MonthCost09,p.MonthCost10,p.MonthCost11,p.MonthCost12,
    p.MonthCost01Employee,p.MonthCost02Employee,p.MonthCost03Employee,p.MonthCost04Employee,
    p.MonthCost05Employee,p.MonthCost06Employee,p.MonthCost07Employee,p.MonthCost08Employee,
    p.MonthCost09Employee,p.MonthCost10Employee,p.MonthCost11Employee,p.MonthCost12Employee,
    p.Cobra01,p.Cobra02,p.Cobra03,p.Cobra04,p.Cobra05,p.Cobra06,p.Cobra07,p.Cobra08,p.Cobra09,p.Cobra10,p.Cobra11,p.Cobra12
  FROM year_health yh
  JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=yh.EmployeeID
  LEFT JOIN monthly_pivot p ON p.EmployeeID=e.EmployeeID
  LEFT JOIN last_week lw ON lw.EmployeeID=e.EmployeeID
  OUTER APPLY (
    SELECT TOP (1) ep.EmployeePayrollCoOnSiteHealthInsuranceID,ep.EmployeePayrollCoOnSiteHealthInsuranceNotes
    FROM tblEmployeePayrollCoOnSite ep WITH (NOLOCK)
    WHERE ep.EmployeeID=e.EmployeeID
    ORDER BY ISNULL(ep.EmployeePayrollCoOnSiteDefault,0) DESC,
      ep.EmployeePayrollCoOnSiteJobApplicationDate DESC,ep.EmployeePayrollCoOnSiteID DESC
  ) ep
  LEFT JOIN tblPullDownHealthInsurance hi WITH (NOLOCK)
    ON hi.PullDownHealthInsuranceID=ep.EmployeePayrollCoOnSiteHealthInsuranceID
  LEFT JOIN tblPullDownHealthInsuranceFlags flag WITH (NOLOCK)
    ON flag.PullDownHealthInsuranceFlagID=e.HealthInsuranceFlagID
  ORDER BY e.EmFirstName,e.EmLastName`, [{ name: "year", value: year }]);
}
