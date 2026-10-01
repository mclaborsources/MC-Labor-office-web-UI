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

/** Full Access unemployment request history, with no TOP or pagination cap. */
export function getAllUnemploymentRequestRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(r.UnemploymentRequestID AS NVARCHAR(20)) AS id,
    CONVERT(VARCHAR(10),r.UnemploymentRequestTimestamp,101) AS Date,
    LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))) AS Employee,
    CONVERT(VARCHAR(10),r.UnemploymentRequestLastWorkDate,101) AS [Last Day of Work],
    ISNULL(c.CustBusName,'') AS [Last Customer],
    ISNULL(tr.PullDownTrade,'') AS Trade,
    ISNULL(reason.PullDownUnemploymentRequestReason,'') AS Reason,
    ISNULL(reasonCont.PullDownUnemploymentRequestReasonCont,'') AS [Reason Cont],
    CONVERT(VARCHAR(10),r.UnemploymentRequestReasonContDate,101) AS [Reason Cont Date],
    ISNULL(contract.PullDownContractWith_PayrollCoName,'') AS [Contract With],
    ISNULL(r.UnemploymentRequestNotes,'') AS Notes,
    ISNULL(r.UnemploymentRequestUserName,'') AS [User Name]
  FROM tblUnemploymentRequests r WITH (NOLOCK)
  LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=r.UnemploymentRequestEmployeeID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=r.UnemploymentRequestLastCustomerID
  LEFT JOIN tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=r.UnemploymentRequestTradeID
  LEFT JOIN tblPullDownUnemploymentRequestReasons reason WITH (NOLOCK)
    ON reason.PullDownUnemploymentRequestReasonID=r.UnemploymentRequestReasonID
  LEFT JOIN tblPullDownUnemploymentRequestReasonCont reasonCont WITH (NOLOCK)
    ON reasonCont.PullDownUnemploymentRequestReasonContID=r.UnemploymentRequestReasonContID
  LEFT JOIN tblPullDownContractWith_PayrollCo contract WITH (NOLOCK)
    ON contract.PullDownContractWith_PayrollCoID=r.UnemploymentRequestContractWith_PayrollCoID
  ORDER BY r.UnemploymentRequestTimestamp DESC,r.UnemploymentRequestID DESC`);
}

/** All contacts used by the unemployment request form. */
export function getAllUnemploymentRequestContactRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(contact.PullDownUnemploymentRequestContactID AS NVARCHAR(20)) AS id,
    ISNULL(contact.PullDownUnemploymentRequestCompany,'') AS Company,
    ISNULL(contact.PullDownUnemploymentRequestContactFName,'') AS [Contact F Name],
    ISNULL(contact.PullDownUnemploymentRequestContactLName,'') AS [Contact L Name],
    ISNULL(state.PullDownState,'') AS State,
    ISNULL(contact.PullDownUnemploymentRequestContactEmail,'') AS Email,
    ISNULL(contact.PullDownUnemploymentRequestContactNotes,'') AS Notes,
    CASE WHEN ISNULL(contact.PullDownUnemploymentRequestContactActive,0)<>0 THEN 'Active' ELSE 'Inactive' END AS Active
  FROM tblPullDownUnemploymentRequestContacts contact WITH (NOLOCK)
  LEFT JOIN tblPullDownStates state WITH (NOLOCK)
    ON state.PullDownStateID=contact.PullDownUnemploymentRequestContactStateID
  ORDER BY contact.PullDownUnemploymentRequestContactSort,contact.PullDownUnemploymentRequestCompany,
    contact.PullDownUnemploymentRequestContactFName,contact.PullDownUnemploymentRequestContactLName`);
}

/** Full Access accident report history, with no TOP or pagination cap. */
export function getAllAccidentReportRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(r.ProjectAccidentReportID AS NVARCHAR(20)) AS id,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportPreparedTimestamp,101) AS Date,
    LTRIM(RTRIM(CONCAT(ISNULL(e.EmFirstName,''),' ',ISNULL(e.EmMiddle,''),' ',ISNULL(e.EmLastName,'')))) AS Employee,
    ISNULL(p.SiteName,'') AS Job,
    ISNULL(siteState.PullDownState,'') AS State,
    ISNULL(tr.PullDownTrade,'') AS Trade,
    ISNULL(payrollCo.PullDownPayrollCoOnSiteInitials,'') AS PayrollCo,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportDateOfInjury,101) AS Injury,
    ISNULL(CONVERT(NVARCHAR(MAX),r.ProjectAccidentReportHowInjuryOccurred),N'') AS [How it happened],
    ISNULL(r.ProjectAccidentReportClaimNumber,'') AS Claim,
    ISNULL(c.CustBusName,'') AS Customer,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportDateReturned,101) AS [Return Date],
    ISNULL(r.ProjectAccidentReportWhyNotReturned,'') AS [Why Not Returned],
    ISNULL(r.ProjectAccidentReportTotalDaysOutOfWork,0) AS [Days Off],
    ISNULL(r.ProjectAccidentReportWorkdaysOutOfWork,0) AS [Workdays Out],
    ISNULL(CONVERT(NVARCHAR(MAX),r.ProjectAccidentReportClaimNotes),N'') AS [Claim Notes],
    ISNULL(benefits.PullDownBenefitsStatus,'') AS [Benefits Status],
    CASE WHEN ISNULL(r.ProjectAccidentReportInHouse,0)<>0 THEN 'Yes' ELSE '' END AS [In House],
    ISNULL(r.ProjectAccidentReportReservedAmount,0) AS Reserve,
    ISNULL(r.ProjectAccidentReportTotalCost,0) AS [Total Cost],
    CASE WHEN ISNULL(r.ProjectAccidentReportClosedOut,0)<>0 THEN 'Yes' ELSE '' END AS Closed,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportFutureCall,101) AS [Future Call],
    LTRIM(RTRIM(CONCAT(ISNULL(adjuster.InsuranceCompanyClaimsAdjusterFName,''),' ',ISNULL(adjuster.InsuranceCompanyClaimsAdjusterLName,'')))) AS [Last Adjuster],
    ISNULL(history.PullDownProjectAccidentReportHistoryStatus,'') AS History
  FROM tblProjectAccidentReports r WITH (NOLOCK)
  LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=r.EmployeeID
  LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=r.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownStateCities siteCity WITH (NOLOCK) ON siteCity.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates siteState WITH (NOLOCK) ON siteState.PullDownStateID=siteCity.StateID
  LEFT JOIN tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=r.ProjectAccidentReportRegularOccupationID
  LEFT JOIN tblEmployeePayrollCoOnSite ep WITH (NOLOCK) ON ep.EmployeePayrollCoOnSiteID=r.EmployeePayrollCompanyOnSiteID
  LEFT JOIN tblPullDownPayrollCoOnSite payrollCo WITH (NOLOCK) ON payrollCo.PullDownPayrollCoOnSiteID=ep.PayrollCoOnSiteID
  LEFT JOIN tblPullDownBenefitsStatus benefits WITH (NOLOCK) ON benefits.PullDownBenefitsStatusID=r.ProjectAccidentReportBenefitsStatusID
  LEFT JOIN tblInsuranceCompanyClaimsAdjusters adjuster WITH (NOLOCK) ON adjuster.InsuranceCompanyClaimsAdjusterID=r.ProjectAccidentReportClaimsAdjusterID
  LEFT JOIN tblPullDownProjectAccidentReportHistoryStatus history WITH (NOLOCK)
    ON history.PullDownProjectAccidentReportHistoryStatusID=r.ProjectAccidentReportHistoryStatusID
  ORDER BY r.ProjectAccidentReportPreparedTimestamp DESC,r.ProjectAccidentReportID DESC`);
}
