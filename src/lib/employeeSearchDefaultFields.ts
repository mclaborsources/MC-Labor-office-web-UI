import { queryReadOnly } from "@/lib/db/sql";

/** Read-only equivalents of Access's default search queries and FDA/average-hours procedures. */
export const EMPLOYEE_DEFAULT_FIELDS_SQL = `
WITH HoursByEmployee AS (
  SELECT EmployeeID, SUM(TotalHours) AS TotalHoursWorked, MIN(WeekEndingDate) AS FirstWeek,
    MAX(CASE WHEN WeekEndingDate <= dbo.GetWeekEndingDate(CAST(GETDATE() AS date))
      THEN WeekEndingDate END) AS LastWorkedWeek
  FROM tblTracking WITH (NOLOCK)
  WHERE ExpenseTypeID IS NULL AND ISNULL(TotalHours, 0) > 0
  GROUP BY EmployeeID
), FirstWeekDays AS (
  SELECT h.EmployeeID, h.FirstWeek,
    SUM(ISNULL(t.SatHours, 0)) AS Day6, SUM(ISNULL(t.SunHours, 0)) AS Day5,
    SUM(ISNULL(t.MonHours, 0)) AS Day4, SUM(ISNULL(t.TueHours, 0)) AS Day3,
    SUM(ISNULL(t.WedHours, 0)) AS Day2, SUM(ISNULL(t.ThuHours, 0)) AS Day1,
    SUM(ISNULL(t.FriHours, 0)) AS Day0
  FROM HoursByEmployee h
  JOIN tblTracking t WITH (NOLOCK) ON t.EmployeeID = h.EmployeeID AND t.WeekEndingDate = h.FirstWeek
  GROUP BY h.EmployeeID, h.FirstWeek
), RecentWeeks AS (
  SELECT t.EmployeeID, t.WeekEndingDate, SUM(t.TotalHours) AS WeeklyHours
  FROM tblTracking t WITH (NOLOCK)
  JOIN HoursByEmployee h ON h.EmployeeID = t.EmployeeID
  WHERE t.ExpenseTypeID IS NULL
    AND t.WeekEndingDate BETWEEN DATEADD(week, -25, h.LastWorkedWeek) AND h.LastWorkedWeek
  GROUP BY t.EmployeeID, t.WeekEndingDate
), AverageHours AS (
  SELECT EmployeeID, ROUND(SUM(WeeklyHours) / COUNT(*), 2) AS AvgHrsWorked
  FROM RecentWeeks GROUP BY EmployeeID
), IpgApplication AS (
  SELECT p.EmployeeID, pc.PullDownPayrollCoOnSiteInitials, js.PullDownJobApplicationStatusDesc,
    ROW_NUMBER() OVER (PARTITION BY p.EmployeeID ORDER BY p.EmployeePayrollCoOnSiteJobApplicationStatusIDTimestamp DESC,
      p.EmployeePayrollCoOnSiteID DESC) AS rn
  FROM tblEmployeePayrollCoOnSite p WITH (NOLOCK)
  LEFT JOIN tblPullDownPayrollCoOnSite pc WITH (NOLOCK) ON pc.PullDownPayrollCoOnSiteID = p.PayrollCoOnSiteID
  LEFT JOIN tblPullDownJobApplicationStatus js WITH (NOLOCK)
    ON js.PullDownJobApplicationStatusID = p.EmployeePayrollCoOnSiteJobApplicationStatusID
  WHERE p.PayrollCoOnSiteID = 1
)
SELECT e.EmployeeID,
  e.TextMsgAddress, b.TextMsgAddress2, b.TextMsgAddress3, b.TextMsgAddress4,
  e.EmLicenseNum, b.LicenseNumber,
  ipg.PullDownPayrollCoOnSiteInitials AS PayrollCoOnSiteInitials_IPG,
  ipg.PullDownJobApplicationStatusDesc AS JobApplicationStatus_IPG,
  b.EmployeeUserFlag5, s1.PullDownS1 AS S1,
  pt.PullDownEmployeeProfileType AS EmployeeProfileType,
  referred.PullDownHowReferred AS EmHowReferred,
  qualification.PullDownQualification AS EmQualification,
  CASE WHEN e.EmployeeNoCommunication <> 0 THEN 'X' ELSE '' END AS EmployeeNoCommunicationText,
  CASE WHEN b.EmMobilePhoneVerify <> 0 THEN 'X' ELSE '' END AS EmMobilePhoneVerifyText,
  licenseFlag.PullDownLicenseExpDateFlag AS LicenseExpDateFlag,
  CONVERT(varchar(10), DATEADD(day, CASE
    WHEN firstDays.Day6 > 0 THEN -6 WHEN firstDays.Day5 > 0 THEN -5
    WHEN firstDays.Day4 > 0 THEN -4 WHEN firstDays.Day3 > 0 THEN -3
    WHEN firstDays.Day2 > 0 THEN -2 WHEN firstDays.Day1 > 0 THEN -1
    WHEN firstDays.Day0 > 0 THEN 0 END, firstDays.FirstWeek), 101) AS FirstDateOnJob,
  h.TotalHoursWorked, averageHours.AvgHrsWorked,
  CONVERT(varchar(10), e.MaxWeekEndingDate, 101) AS WeekEndingDate,
  latest.PayRate, latest.CustomerBusName, latest.SiteName, latest.PayrollCoOnSiteInitials,
  'Online' AS OnlineJobAppFolder
FROM tblEmployee e WITH (NOLOCK)
LEFT JOIN tblEmployeeB b WITH (NOLOCK) ON b.EmployeeID = e.EmployeeID
LEFT JOIN tblPullDownEmployeeProfileTypes pt WITH (NOLOCK) ON pt.PullDownEmployeeProfileTypeID = e.EmployeeProfileTypeID
LEFT JOIN tblPullDownHowReferred referred WITH (NOLOCK) ON referred.PullDownHowReferredID = e.EmHowReferredID
LEFT JOIN tblPullDownQualifications qualification WITH (NOLOCK) ON qualification.PullDownQualificationID = e.EmQualificationID
LEFT JOIN tblPullDownS1 s1 WITH (NOLOCK) ON s1.PullDownS1ID = b.S1ID
LEFT JOIN tblPullDownLicenseExpDateFlags licenseFlag WITH (NOLOCK) ON licenseFlag.PullDownLicenseExpDateFlagID = b.LicenseExpDateFlagID
LEFT JOIN tblTracking latest WITH (NOLOCK) ON latest.TrackingID = e.MaxTrackingID
LEFT JOIN HoursByEmployee h ON h.EmployeeID = e.EmployeeID
LEFT JOIN FirstWeekDays firstDays ON firstDays.EmployeeID = e.EmployeeID
LEFT JOIN AverageHours averageHours ON averageHours.EmployeeID = e.EmployeeID
LEFT JOIN IpgApplication ipg ON ipg.EmployeeID = e.EmployeeID AND ipg.rn = 1
`;

const numberFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatEmployeeDefaultFields(row: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (value === null || value === undefined) return [key, ""];
    if (["TotalHoursWorked", "AvgHrsWorked", "PayRate"].includes(key)) {
      const number = Number(value);
      return [key, Number.isFinite(number) ? numberFormat.format(number) : ""];
    }
    return [key, String(value).trim()];
  }));
}

export async function loadEmployeeDefaultFields(): Promise<Map<string, Record<string, string>>> {
  const rows = await queryReadOnly<Record<string, unknown>>(EMPLOYEE_DEFAULT_FIELDS_SQL);
  return new Map(rows.map(row => [String(row.EmployeeID), formatEmployeeDefaultFields(row)]));
}
