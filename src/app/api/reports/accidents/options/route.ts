import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireSession(); }
  catch { return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 }); }
  try {
    const [employees, projects, trades, preparedBy, payrollCompanies, contracts, benefits, history, insurers, adjusters] = await Promise.all([
      queryReadOnly(`SELECT e.EmployeeID AS id,LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))) AS label,e.EmSex AS sex FROM tblEmployee e WITH (NOLOCK) WHERE ISNULL(e.EmFirstName,'')<>'' ORDER BY e.EmLastName,e.EmFirstName`),
      queryReadOnly(`SELECT p.ProjectID AS id,p.SiteName AS label,c.CustBusName AS customer,p.SiteStreet AS street,p.SiteForemanID AS foremanId FROM tblProject p WITH (NOLOCK) LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID WHERE ISNULL(p.SiteName,'')<>'' ORDER BY c.CustBusName,p.SiteName`),
      queryReadOnly(`SELECT PullDownTradeID AS id,PullDownTrade AS label FROM tblPullDownTrade WITH (NOLOCK) ORDER BY PullDownTrade`),
      queryReadOnly(`SELECT PullDownSalesmanID AS id,LTRIM(RTRIM(CONCAT(ISNULL(PullDownSalesmanFName,''),' ',ISNULL(PullDownSalesmanLName,'')))) AS label,PullDownSalesmanTitle AS title FROM tblPullDownSalesman WITH (NOLOCK) ORDER BY PullDownSalesmanFName,PullDownSalesmanLName`),
      queryReadOnly(`SELECT EmployeePayrollCoOnSiteID AS id,PullDownPayrollCoOnSiteInitials AS label FROM tblEmployeePayrollCoOnSite WITH (NOLOCK) INNER JOIN tblPullDownPayrollCoOnSite WITH (NOLOCK) ON PayrollCoOnSiteID=PullDownPayrollCoOnSiteID ORDER BY PullDownPayrollCoOnSiteInitials`),
      queryReadOnly(`SELECT PullDownContractWith_PayrollCoID AS id,PullDownContractWith_PayrollCoName AS label FROM tblPullDownContractWith_PayrollCo WITH (NOLOCK) ORDER BY PullDownContractWith_PayrollCoName`),
      queryReadOnly(`SELECT PullDownBenefitsStatusID AS id,PullDownBenefitsStatus AS label FROM tblPullDownBenefitsStatus WITH (NOLOCK) ORDER BY PullDownBenefitsStatus`),
      queryReadOnly(`SELECT PullDownProjectAccidentReportHistoryStatusID AS id,PullDownProjectAccidentReportHistoryStatus AS label,PullDownProjectAccidentReportHistoryStatusDesc AS description FROM tblPullDownProjectAccidentReportHistoryStatus WITH (NOLOCK) ORDER BY PullDownProjectAccidentReportHistoryStatusSort,PullDownProjectAccidentReportHistoryStatus`),
      queryReadOnly(`SELECT InsuranceCompanyID AS id,InsuranceCompanyName AS label FROM tblInsuranceCompanies WITH (NOLOCK) ORDER BY InsuranceCompanySort,InsuranceCompanyName`),
      queryReadOnly(`SELECT a.InsuranceCompanyClaimsAdjusterID AS id,a.InsuranceCompanyID,LTRIM(RTRIM(CONCAT(ISNULL(a.InsuranceCompanyClaimsAdjusterFName,''),' ',ISNULL(a.InsuranceCompanyClaimsAdjusterLName,'')))) AS label FROM tblInsuranceCompanyClaimsAdjusters a WITH (NOLOCK) ORDER BY a.InsuranceCompanyID,a.InsuranceCompanyClaimsAdjusterFName,a.InsuranceCompanyClaimsAdjusterLName`),
    ]);
    return NextResponse.json({ ok: true, employees, projects, trades, preparedBy, payrollCompanies, contracts, benefits, history, insurers, adjusters });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unable to load accident report lists.";
    return NextResponse.json({ ok: false, error: detail }, { status: 500 });
  }
}
