import { queryReadOnly } from "@/lib/db/sql";

export interface EmployeePayRateReferralAgencyRow {
  id: number;
  firstName: string;
  middle: string;
  lastName: string;
  payrollCompany: string;
  jobApplicationStatus: string;
  referralAgency: string;
  agencyReferralRatePerHr: number;
  payRate: number;
  lastWeekAssigned: string;
}

export async function getEmployeesWithPayRateAndReferralAgency() {
  return queryReadOnly<EmployeePayRateReferralAgencyRow>(`SELECT
      ep.EmployeePayrollCoOnSiteID id,
      ISNULL(e.EmFirstName,'') firstName,
      ISNULL(e.EmMiddle,'') middle,
      ISNULL(e.EmLastName,'') lastName,
      ISNULL(pc.PullDownPayrollCoOnSiteInitials,pc.PullDownPayrollCoOnSiteName) payrollCompany,
      ISNULL(jas.PullDownJobApplicationStatus,'') jobApplicationStatus,
      ISNULL(ra.PullDownReferralAgency,'') referralAgency,
      ISNULL(e.AgencyReferralRatePerHr,0) agencyReferralRatePerHr,
      ISNULL(e.BaseSalary,0) payRate,
      CONVERT(varchar(10),COALESCE(ep.EmployeePayrollCoOnSiteMaxWeekEndingDate,latest.WeekEndingDate),101) lastWeekAssigned
    FROM dbo.tblEmployee e WITH (NOLOCK)
    INNER JOIN dbo.tblEmployeePayrollCoOnSite ep WITH (NOLOCK) ON ep.EmployeeID=e.EmployeeID
    LEFT JOIN dbo.tblPullDownPayrollCoOnSite pc WITH (NOLOCK) ON pc.PullDownPayrollCoOnSiteID=ep.PayrollCoOnSiteID
    LEFT JOIN dbo.tblPullDownJobApplicationStatus jas WITH (NOLOCK) ON jas.PullDownJobApplicationStatusID=ep.EmployeePayrollCoOnSiteJobApplicationStatusID
    LEFT JOIN dbo.tblPullDownReferralAgencies ra WITH (NOLOCK) ON ra.PullDownReferralAgencyID=e.ReferralAgencyID
    OUTER APPLY (
      SELECT TOP (1) t.WeekEndingDate
      FROM dbo.tblTracking t WITH (NOLOCK)
      WHERE t.EmployeeID=ep.EmployeeID AND t.PayrollCoOnSiteID=ep.PayrollCoOnSiteID
      ORDER BY t.WeekEndingDate DESC,t.AssignmentTimestamp DESC
    ) latest
    WHERE ISNULL(e.ReferralAgencyID,0)<>0
      AND (ISNULL(e.BaseSalary,0)<>0 OR ISNULL(e.AgencyReferralRatePerHr,0)<>0)
    ORDER BY e.EmFirstName,e.EmLastName,pc.PullDownPayrollCoOnSiteInitials`);
}
