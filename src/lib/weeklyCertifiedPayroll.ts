import { queryReadOnly } from "@/lib/db/sql";
import type { TrackingWeekOption } from "@/lib/adminReportQueries";

export interface WeeklyCertifiedPayrollRow {
  id: string;
  projectId: string;
  company: string;
  companyAddress: string;
  companyPhone: string;
  awardingAuthority: string;
  projectName: string;
  projectLocation: string;
  minimumWageSheet: string;
  primeContractor: string;
  reportRecipient: string;
  recipientContact: string;
  recipientAddress: string;
  employee: string;
  hours: number;
}

export function getCertifiedPayrollWeeks(): Promise<TrackingWeekOption[]> {
  return queryReadOnly<TrackingWeekOption>(`SELECT DISTINCT CONVERT(VARCHAR(10),WeekEndingDate,23) AS value,
    CONVERT(VARCHAR(10),WeekEndingDate,101) AS label
    FROM dbo.tblTracking WITH (NOLOCK) WHERE WeekEndingDate IS NOT NULL
    ORDER BY value DESC`);
}

export function getWeeklyCertifiedPayrollRows(weekEnding: string): Promise<WeeklyCertifiedPayrollRow[]> {
  return queryReadOnly<WeeklyCertifiedPayrollRow>(`SELECT
    CONCAT(CAST(t.ProjectID AS NVARCHAR(30)),'-',CAST(t.EmployeeID AS NVARCHAR(30))) AS id,
    CAST(t.ProjectID AS NVARCHAR(30)) AS projectId,
    ISNULL(c.CustBusName,'') AS company,
    LTRIM(RTRIM(CONCAT(ISNULL(c.Street,''),CASE WHEN NULLIF(c.City,'') IS NULL THEN '' ELSE CONCAT(', ',c.City) END,
      CASE WHEN NULLIF(c.State,'') IS NULL THEN '' ELSE CONCAT(', ',c.State) END,
      CASE WHEN NULLIF(c.Zip,'') IS NULL THEN '' ELSE CONCAT(' ',c.Zip) END))) AS companyAddress,
    ISNULL(c.Phone,'') AS companyPhone,
    ISNULL(p.AwardingAuthorityName,'') AS awardingAuthority,
    ISNULL(p.SiteName,'') AS projectName,
    LTRIM(RTRIM(CONCAT(ISNULL(p.SiteStreet,''),CASE WHEN NULLIF(sc.City,'') IS NULL THEN '' ELSE CONCAT(', ',sc.City) END,
      CASE WHEN NULLIF(st.PullDownState,'') IS NULL THEN '' ELSE CONCAT(', ',st.PullDownState) END,
      CASE WHEN NULLIF(p.SiteZip,'') IS NULL THEN '' ELSE CONCAT(' ',p.SiteZip) END))) AS projectLocation,
    ISNULL(p.MinWageRateSheetNumber,'') AS minimumWageSheet,
    ISNULL(p.CertifiedPayrollGC,'') AS primeContractor,
    ISNULL(recipient.ProjectCertifiedPayrollName,'') AS reportRecipient,
    ISNULL(recipient.ProjectCertifiedPayrollContactPerson,'') AS recipientContact,
    LTRIM(RTRIM(CONCAT(ISNULL(recipient.ProjectCertifiedPayrollStreet,''),
      CASE WHEN NULLIF(rc.City,'') IS NULL THEN '' ELSE CONCAT(', ',rc.City) END,
      CASE WHEN NULLIF(rs.PullDownState,'') IS NULL THEN '' ELSE CONCAT(', ',rs.PullDownState) END,
      CASE WHEN NULLIF(recipient.ProjectCertifiedPayrollZip,'') IS NULL THEN '' ELSE CONCAT(' ',recipient.ProjectCertifiedPayrollZip) END))) AS recipientAddress,
    LTRIM(RTRIM(CONCAT(ISNULL(t.EmFirstName,''),CASE WHEN NULLIF(t.EmMiddle,'') IS NULL THEN '' ELSE CONCAT(' ',t.EmMiddle) END,
      CASE WHEN NULLIF(t.EmLastName,'') IS NULL THEN '' ELSE CONCAT(' ',t.EmLastName) END))) AS employee,
    SUM(ISNULL(t.TotalHours,0)) AS hours
  FROM dbo.tblTracking t WITH (NOLOCK)
  JOIN dbo.tblProject p WITH (NOLOCK) ON p.ProjectID=t.ProjectID
  LEFT JOIN dbo.tblCustomer c WITH (NOLOCK) ON c.CustomerID=t.CustomerID
  LEFT JOIN dbo.tblPullDownStateCities sc WITH (NOLOCK) ON sc.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN dbo.tblPullDownStates st WITH (NOLOCK) ON st.PullDownStateID=sc.StateID
  OUTER APPLY (SELECT TOP (1) cp.ProjectCertifiedPayrollName,cp.ProjectCertifiedPayrollContactPerson,
      cp.ProjectCertifiedPayrollStreet,cp.ProjectCertifiedPayrollStateCityID,cp.ProjectCertifiedPayrollZip
    FROM dbo.tblProjectCertifiedPayroll cp WITH (NOLOCK)
    WHERE cp.ProjectID=p.ProjectID ORDER BY cp.ProjectCertifiedPayrollID) recipient
  LEFT JOIN dbo.tblPullDownStateCities rc WITH (NOLOCK) ON rc.PullDownStateCityID=recipient.ProjectCertifiedPayrollStateCityID
  LEFT JOIN dbo.tblPullDownStates rs WITH (NOLOCK) ON rs.PullDownStateID=rc.StateID
  WHERE t.WeekEndingDate>=CONVERT(date,@weekEnding,23)
    AND t.WeekEndingDate<DATEADD(day,1,CONVERT(date,@weekEnding,23))
    AND t.ProjectID IS NOT NULL AND t.EmployeeID IS NOT NULL AND t.ExpenseTypeID IS NULL
  GROUP BY t.ProjectID,t.EmployeeID,c.CustBusName,c.Street,c.City,c.State,c.Zip,c.Phone,
    p.AwardingAuthorityName,p.SiteName,p.SiteStreet,sc.City,st.PullDownState,p.SiteZip,p.MinWageRateSheetNumber,p.CertifiedPayrollGC,
    recipient.ProjectCertifiedPayrollName,recipient.ProjectCertifiedPayrollContactPerson,recipient.ProjectCertifiedPayrollStreet,
    rc.City,rs.PullDownState,recipient.ProjectCertifiedPayrollZip,t.EmFirstName,t.EmMiddle,t.EmLastName
  ORDER BY company,projectName,employee`, [{ name: "weekEnding", value: weekEnding }]);
}
