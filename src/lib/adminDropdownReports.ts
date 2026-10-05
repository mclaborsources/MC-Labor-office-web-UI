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
    CAST(r.UnemploymentRequestEmployeeID AS NVARCHAR(20)) AS EmployeeID,
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
  return getUnemploymentContactFaxColumn().then(faxColumn => {
  const faxSelect = faxColumn ? `ISNULL(CONVERT(NVARCHAR(100),contact.[${faxColumn.replace(/]/g,"]]" )}]),'')` : `CAST('' AS NVARCHAR(100))`;
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(contact.PullDownUnemploymentRequestContactID AS NVARCHAR(20)) AS id,
    ISNULL(contact.PullDownUnemploymentRequestCompany,'') AS Company,
    ISNULL(contact.PullDownUnemploymentRequestContactFName,'') AS [Contact F Name],
    ISNULL(contact.PullDownUnemploymentRequestContactLName,'') AS [Contact L Name],
    ISNULL(contact.PullDownUnemploymentRequestContactStreet,'') AS Street,
    ISNULL(contact.PullDownUnemploymentRequestContactCity,'') AS City,
    ISNULL(state.PullDownState,'') AS State,
    CAST(ISNULL(contact.PullDownUnemploymentRequestContactStateID,0) AS NVARCHAR(20)) AS StateID,
    ISNULL(contact.PullDownUnemploymentRequestContactZip,'') AS Zip,
    ISNULL(contact.PullDownUnemploymentRequestContactPhone,'') AS Phone,
    ${faxSelect} AS Fax,
    ISNULL(contact.PullDownUnemploymentRequestContactEmail,'') AS Email,
    ISNULL(contact.PullDownUnemploymentRequestContactSort,0) AS Sort,
    ISNULL(contact.PullDownUnemploymentRequestContactNotes,'') AS Notes,
    CASE WHEN ISNULL(contact.PullDownUnemploymentRequestContactActive,0)<>0 THEN 'Active' ELSE 'Inactive' END AS Active
  FROM tblPullDownUnemploymentRequestContacts contact WITH (NOLOCK)
  LEFT JOIN tblPullDownStates state WITH (NOLOCK)
    ON state.PullDownStateID=contact.PullDownUnemploymentRequestContactStateID
  ORDER BY contact.PullDownUnemploymentRequestContactSort,contact.PullDownUnemploymentRequestCompany,
    contact.PullDownUnemploymentRequestContactFName,contact.PullDownUnemploymentRequestContactLName`);
  });
}

export async function getUnemploymentContactFaxColumn(): Promise<string | null> {
  const columns = await queryReadOnly<{ name: string }>(`SELECT c.name
    FROM sys.columns c
    WHERE c.object_id=OBJECT_ID(N'dbo.tblPullDownUnemploymentRequestContacts')`);
  return columns.find(({name})=>/fax/i.test(name))?.name ?? null;
}

export async function getUnemploymentContactStates(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT CAST(PullDownStateID AS NVARCHAR(20)) AS id,ISNULL(PullDownState,'') AS label
  FROM tblPullDownStates WITH (NOLOCK) ORDER BY PullDownState`);
}

/** Lookup values used by the unemployment request editor, sourced from Access dropdown tables. */
export async function getUnemploymentRequestDropdownRows() {
  const [reasons, reasonDetails, contracts] = await Promise.all([
    queryReadOnly<OperationalReportRow>(`SELECT
      CAST(PullDownUnemploymentRequestReasonID AS NVARCHAR(20)) AS id,
      ISNULL(PullDownUnemploymentRequestReason,'') AS label
    FROM tblPullDownUnemploymentRequestReasons WITH (NOLOCK)
    ORDER BY PullDownUnemploymentRequestReason`),
    queryReadOnly<OperationalReportRow>(`SELECT
      CAST(PullDownUnemploymentRequestReasonContID AS NVARCHAR(20)) AS id,
      ISNULL(PullDownUnemploymentRequestReasonCont,'') AS label
    FROM tblPullDownUnemploymentRequestReasonCont WITH (NOLOCK)
    ORDER BY PullDownUnemploymentRequestReasonCont`),
    queryReadOnly<OperationalReportRow>(`SELECT
      CAST(PullDownContractWith_PayrollCoID AS NVARCHAR(20)) AS id,
      ISNULL(PullDownContractWith_PayrollCoName,'') AS label
    FROM tblPullDownContractWith_PayrollCo WITH (NOLOCK)
    ORDER BY PullDownContractWith_PayrollCoName`),
  ]);
  return { reasons, reasonDetails, contracts };
}

/** Employee assignment and weekly work history for the Access Employee Work History view. */
export function getEmployeeWorkHistoryRows(employeeId: number, startDate: string, endDate: string): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(t.TrackingID AS NVARCHAR(20)) AS id,
    ISNULL(t.PayrollCoOnSiteInitials,'') AS [Payroll Co], ISNULL(t.CustomerBusName,'') AS Customer,
    ISNULL(t.SiteName,'') AS Job, ISNULL(t.SiteState,'') AS State, ISNULL(t.GradeChange,'') AS Grade,
    CONVERT(VARCHAR(10),t.WeekEndingDate,101) AS [Week Ending],
    ISNULL(t.SatStatusFlagID,0) AS SatStatus, ISNULL(t.SunStatusFlagID,0) AS SunStatus,
    ISNULL(t.MonStatusFlagID,0) AS MonStatus, ISNULL(t.TueStatusFlagID,0) AS TueStatus,
    ISNULL(t.WedStatusFlagID,0) AS WedStatus, ISNULL(t.ThuStatusFlagID,0) AS ThuStatus, ISNULL(t.FriStatusFlagID,0) AS FriStatus,
    ISNULL(t.SatHours,0) AS Sat, ISNULL(t.SunHours,0) AS Sun, ISNULL(t.MonHours,0) AS Mon,
    ISNULL(t.TueHours,0) AS Tue, ISNULL(t.WedHours,0) AS Wed, ISNULL(t.ThuHours,0) AS Thu, ISNULL(t.FriHours,0) AS Fri,
    ISNULL(t.TotalHours,0) AS Total,
    CAST(ISNULL(t.TotalHours,0)*ISNULL(t.PayRate,0) AS DECIMAL(12,2)) AS [Gross Payroll],
    ISNULL(t.PayRate,0) AS [Pay Rate], ISNULL(t.BillRate,0) AS [Bill Rate], ISNULL(t.TrackMargin,0) AS Margin,
    ISNULL(t.HoursNote,'') AS [Check Note], ISNULL(t.HealthInsuranceDesc,'') AS Health,
    ISNULL(t.CoExpParkingPerHr,0) AS [Parking Per Hr],
    ISNULL(t.EmFirstName,'') AS [First Name], ISNULL(t.EmMiddle,'') AS MI, ISNULL(t.EmLastName,'') AS [Last Name]
  FROM tblTracking t WITH (NOLOCK)
  WHERE t.EmployeeID=@employeeId AND t.WeekEndingDate>=@startDate AND t.WeekEndingDate<DATEADD(day,1,@endDate)
  ORDER BY t.WeekEndingDate,t.CustomerBusName,t.SiteName,t.TrackingID`, [
    { name: "employeeId", value: employeeId }, { name: "startDate", value: startDate }, { name: "endDate", value: endDate },
  ]);
}

/** Full Access accident report history, with no TOP or pagination cap. */
export function getAllAccidentReportRows(): Promise<OperationalReportRow[]> {
  return queryReadOnly<OperationalReportRow>(`SELECT
    CAST(r.ProjectAccidentReportID AS NVARCHAR(20)) AS id,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportPreparedTimestamp,101) AS Date,
    LTRIM(RTRIM(CONCAT(ISNULL(preparedBy.PullDownSalesmanFName,''),' ',ISNULL(preparedBy.PullDownSalesmanLName,'')))) AS [Prepared By],
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
    CASE
      WHEN r.ProjectAccidentReportDateReturned IS NOT NULL THEN NULL
      WHEN r.ProjectAccidentReportDateOfInjury IS NULL THEN NULL
      WHEN workdays.Weekdays-2 < 0 THEN 0
      ELSE workdays.Weekdays-2
    END AS [Workdays Off To-Date],
    ISNULL(CONVERT(NVARCHAR(MAX),r.ProjectAccidentReportClaimNotes),N'') AS [Claim Notes],
    ISNULL(benefits.PullDownBenefitsStatus,'') AS [Benefits Status],
    CASE WHEN ISNULL(r.ProjectAccidentReportInHouse,0)<>0 THEN 'Yes' ELSE '' END AS [In House],
    ISNULL(r.ProjectAccidentReportReservedAmount,0) AS Reserve,
    ISNULL(r.ProjectAccidentReportTotalCost,0) AS [Total Cost],
    CASE WHEN ISNULL(r.ProjectAccidentReportClosedOut,0)<>0 THEN 'Yes' ELSE '' END AS Closed,
    CONVERT(VARCHAR(10),r.ProjectAccidentReportFutureCall,101) AS [Future Call],
    ISNULL(insurer.InsuranceCompanyName,'') AS [Insurance Company],
    LTRIM(RTRIM(CONCAT(ISNULL(adjuster.InsuranceCompanyClaimsAdjusterFName,''),' ',ISNULL(adjuster.InsuranceCompanyClaimsAdjusterLName,'')))) AS [Last Adjuster],
    ISNULL(adjuster.InsuranceCompanyClaimsAdjusterEmail,'') AS [Adjuster Email],
    ISNULL(adjuster.InsuranceCompanyClaimsAdjusterPhone,'') AS [Adjuster Phone],
    ISNULL(adjuster.InsuranceCompanyClaimsAdjusterExtension,'') AS [Adjuster Extension],
    ISNULL(CONVERT(NVARCHAR(MAX),adjuster.InsuranceCompanyClaimsAdjusterNotes),N'') AS [Adjuster Notes],
    CASE WHEN r.ProjectAccidentReportHistoryStatusID IS NULL THEN N'' ELSE CONCAT(
      ISNULL(CONVERT(NVARCHAR(255),history.PullDownProjectAccidentReportHistoryStatus),N''),N' - ',
      ISNULL(CONVERT(NVARCHAR(255),history.PullDownProjectAccidentReportHistoryStatusDesc),N'')) END AS History,
    CASE WHEN p.CustomerID IS NULL THEN NULL ELSE COUNT(*) OVER (PARTITION BY r.EmployeeID,p.CustomerID) END AS [Accidents with Customer]
  FROM tblProjectAccidentReports r WITH (NOLOCK)
  LEFT JOIN tblEmployee e WITH (NOLOCK) ON e.EmployeeID=r.EmployeeID
  LEFT JOIN tblProject p WITH (NOLOCK) ON p.ProjectID=r.ProjectID
  LEFT JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=p.CustomerID
  LEFT JOIN tblPullDownStateCities siteCity WITH (NOLOCK) ON siteCity.PullDownStateCityID=p.SiteStateCityID
  LEFT JOIN tblPullDownStates siteState WITH (NOLOCK) ON siteState.PullDownStateID=siteCity.StateID
  LEFT JOIN tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=r.ProjectAccidentReportRegularOccupationID
  LEFT JOIN tblPullDownSalesman preparedBy WITH (NOLOCK) ON preparedBy.PullDownSalesmanID=r.ProjectAccidentReportPreparedByID
  LEFT JOIN tblEmployeePayrollCoOnSite ep WITH (NOLOCK) ON ep.EmployeePayrollCoOnSiteID=r.EmployeePayrollCompanyOnSiteID
  LEFT JOIN tblPullDownPayrollCoOnSite payrollCo WITH (NOLOCK) ON payrollCo.PullDownPayrollCoOnSiteID=ep.PayrollCoOnSiteID
  LEFT JOIN tblPullDownBenefitsStatus benefits WITH (NOLOCK) ON benefits.PullDownBenefitsStatusID=r.ProjectAccidentReportBenefitsStatusID
  LEFT JOIN tblInsuranceCompanies insurer WITH (NOLOCK) ON insurer.InsuranceCompanyID=r.ProjectAccidentReportInsuranceCompanyID
  LEFT JOIN tblInsuranceCompanyClaimsAdjusters adjuster WITH (NOLOCK) ON adjuster.InsuranceCompanyClaimsAdjusterID=r.ProjectAccidentReportClaimsAdjusterID
  LEFT JOIN tblPullDownProjectAccidentReportHistoryStatus history WITH (NOLOCK)
    ON history.PullDownProjectAccidentReportHistoryStatusID=r.ProjectAccidentReportHistoryStatusID
  CROSS APPLY (VALUES (
    DATEDIFF(DAY,CONVERT(DATE,'19000101'),CONVERT(DATE,r.ProjectAccidentReportDateOfInjury))%7,
    DATEDIFF(DAY,CONVERT(DATE,r.ProjectAccidentReportDateOfInjury),CONVERT(DATE,GETDATE()))+1
  )) span(StartWeekday,SpanDays)
  CROSS APPLY (VALUES (
    5*(span.SpanDays/7)
    + CASE WHEN span.SpanDays%7>0 AND (span.StartWeekday+0)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>1 AND (span.StartWeekday+1)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>2 AND (span.StartWeekday+2)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>3 AND (span.StartWeekday+3)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>4 AND (span.StartWeekday+4)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>5 AND (span.StartWeekday+5)%7<5 THEN 1 ELSE 0 END
    + CASE WHEN span.SpanDays%7>6 AND (span.StartWeekday+6)%7<5 THEN 1 ELSE 0 END
  )) workdays(Weekdays)
  ORDER BY r.ProjectAccidentReportPreparedTimestamp DESC,r.ProjectAccidentReportID DESC`);
}
