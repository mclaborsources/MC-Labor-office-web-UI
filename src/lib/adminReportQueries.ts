import { queryReadOnly } from "@/lib/db/sql";
import type { OperationalReportRow } from "@/lib/operationalReports";

export type EmployeeDocumentMode = "licenses" | "interview" | "osha" | "resume" | "smartphone" | "face" | "id";
export interface EmployeeDocumentRow {
  id: string; employeeId: string; employee: string; cell: string; trade: string;
  qualification: string; assignment: string; weekEnding: string; status: string; details: string;
  totalRecords: number;
}

/** Read permanent Access tables, never the per-session employee search holding table. */
export function getEmployeeDocumentRows(mode: EmployeeDocumentMode, search = "", page = 1): Promise<EmployeeDocumentRow[]> {
  const safePage = Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1;
  const searchPattern = search.trim().replaceAll("[", "[[]").replaceAll("%", "[%]").replaceAll("_", "[_]");
  const expressions: Record<EmployeeDocumentMode, { status: string; details: string }> = {
    licenses: {
      status: "ISNULL(lt.PullDownLicenseType,'')",
      details: "CONCAT('Number: ',ISNULL(l.EmployeeLicenseNumber,''),' | State: ',ISNULL(ls.PullDownState,''),' | Expires: ',ISNULL(CONVERT(VARCHAR(10),l.EmployeeLicenseExpDate,101),''),' | Copy: ',ISNULL(l.EmployeeLicenseCopyOnFile,''),' | ',ISNULL(l.EmployeeLicenseNotes,''))",
    },
    interview: { status: "CASE WHEN e.InterviewQuestions IS NULL THEN '' WHEN e.InterviewQuestions<>0 THEN 'Yes' ELSE 'No' END", details: "ISNULL(e.InterviewQuestionsNotes,'')" },
    osha: { status: "ISNULL(os.PullDownOSHA10StatusDesc,ISNULL(e.OSHA10,''))", details: "CONCAT(ISNULL(e.EmOSHANotes,''),CASE WHEN NULLIF(e.OSHANumber,'') IS NULL THEN '' ELSE CONCAT(' | OSHA Number: ',e.OSHANumber) END)" },
    resume: { status: "CASE WHEN e.ResumeOrWorkHistory IS NULL THEN '' WHEN e.ResumeOrWorkHistory<>0 THEN 'Yes' ELSE 'No' END", details: "ISNULL(e.ResumeOrWorkHistoryNotes,'')" },
    smartphone: { status: "ISNULL(e.EmSmartPhone,'')", details: "''" },
    face: { status: "CASE WHEN e.FaceMeeting IS NULL THEN '' WHEN e.FaceMeeting<>0 THEN 'Yes' ELSE 'No' END", details: "ISNULL(e.FaceMeetingNotes,'')" },
    id: {
      status: "ISNULL(it.PullDownIDTitle,'')",
      details: "CONCAT('Number: ',ISNULL(doc.Number,''),' | Agency: ',ISNULL(doc.Agency,''),' | Expires: ',ISNULL(CONVERT(VARCHAR(10),doc.ExpDate,101),''),' | On File: ',CASE WHEN doc.OnFile<>0 THEN 'Yes' ELSE 'No' END)",
    },
  };
  const selected = expressions[mode];
  const joins = mode === "licenses" ? `JOIN dbo.tblEmployeeLicenses l WITH (NOLOCK) ON l.EmployeeID=e.EmployeeID
    LEFT JOIN dbo.tblPullDownLicenseTypes lt WITH (NOLOCK) ON lt.PullDownLicenseTypeID=l.EmployeeLicenseTypeID
    LEFT JOIN dbo.tblPullDownStates ls WITH (NOLOCK) ON ls.PullDownStateID=l.EmployeeLicenseStateID`
    : mode === "id" ? `CROSS APPLY (VALUES
      (1,e.ID1TitleID,e.ID1Number,e.ID1Agency,e.ID1ExpDate,e.ID1DocOnFile,e.ID1Use),
      (2,e.ID2TitleID,e.ID2Number,e.ID2Agency,e.ID2ExpDate,e.ID2DocOnFile,e.ID2Use),
      (3,e.ID3TitleID,e.ID3Number,e.ID3Agency,e.ID3ExpDate,e.ID3DocOnFile,e.ID3Use)
    ) doc(Slot,TitleID,Number,Agency,ExpDate,OnFile,InUse)
    LEFT JOIN dbo.tblPullDownIDTitles it WITH (NOLOCK) ON it.PullDownIDTitleID=doc.TitleID`
    : mode === "osha" ? "LEFT JOIN dbo.tblPullDownOSHA10Status os WITH (NOLOCK) ON os.PullDownOSHA10StatusID=e.OSHA10StatusID" : "";
  const id = mode === "licenses" ? "CAST(l.EmployeeLicenseID AS NVARCHAR(30))"
    : mode === "id" ? "CONCAT(e.EmployeeID,'-',doc.Slot)" : "CAST(e.EmployeeID AS NVARCHAR(30))";
  return queryReadOnly<EmployeeDocumentRow>(`WITH records AS (SELECT ${id} AS id,
    CAST(e.EmployeeID AS NVARCHAR(30)) AS employeeId,
    e.EmLastName AS lastName,e.EmFirstName AS firstName,
    LTRIM(RTRIM(CONCAT(e.EmFirstName,' ',e.EmMiddle,' ',e.EmLastName))) AS employee,
    ISNULL(e.EmMobilePhone,'') AS cell,ISNULL(tr.PullDownTrade,'') AS trade,
    ISNULL(q.PullDownQualification,'') AS qualification,
    ${selected.status} AS status,${selected.details} AS details
  FROM dbo.tblEmployee e WITH (NOLOCK)
  LEFT JOIN dbo.tblPullDownTrade tr WITH (NOLOCK) ON tr.PullDownTradeID=e.EmTradeID
  LEFT JOIN dbo.tblPullDownQualifications q WITH (NOLOCK) ON q.PullDownQualificationID=e.EmQualificationID
  ${joins}
  ${mode === "id" ? "WHERE doc.TitleID IS NOT NULL OR NULLIF(doc.Number,'') IS NOT NULL OR doc.OnFile<>0 OR doc.InUse<>0" : ""}
  ), matched AS (
    SELECT *,COUNT(*) OVER () AS totalRecords FROM records
    WHERE @search='' OR CONCAT(employee,' ',cell,' ',trade,' ',qualification,' ',status,' ',details) LIKE @searchPattern
  ), paged AS (
    SELECT * FROM matched ORDER BY lastName,firstName,id OFFSET @offset ROWS FETCH NEXT 200 ROWS ONLY
  )
  SELECT p.id,p.employeeId,p.employee,p.cell,p.trade,p.qualification,p.status,p.details,p.totalRecords,
    CONCAT(ISNULL(a.CustomerBusName,''),CASE WHEN NULLIF(a.SiteName,'') IS NULL THEN '' ELSE CONCAT(' / ',a.SiteName) END) AS assignment,
    ISNULL(CONVERT(VARCHAR(10),a.WeekEndingDate,101),'') AS weekEnding
  FROM paged p
  OUTER APPLY (
    SELECT TOP (1) t.CustomerBusName,t.SiteName,t.WeekEndingDate
    FROM dbo.tblTracking t WITH (NOLOCK) WHERE t.EmployeeID=TRY_CONVERT(INT,p.employeeId) AND t.ExpenseTypeID IS NULL
    ORDER BY t.WeekEndingDate DESC,t.TrackingID DESC
  ) a
  ORDER BY p.lastName,p.firstName,p.id`, [
    { name: "search", value: search.trim() }, { name: "searchPattern", value: `%${searchPattern}%` },
    { name: "offset", value: (safePage - 1) * 200 },
  ]);
}

export interface PayrollExclusionRow { id: string; employeeId: string; employee: string; city: string; payroll: string; active: boolean }
export function getPayrollExclusionRows(): Promise<PayrollExclusionRow[]> {
  return queryReadOnly<PayrollExclusionRow>(`SELECT CAST(x.PayrollExclusionID AS NVARCHAR(30)) AS id,
    CAST(x.PayrollExclusionEmployeeID AS NVARCHAR(30)) AS employeeId,
    LTRIM(RTRIM(CONCAT(e.EmFirstName,' ',e.EmMiddle,' ',e.EmLastName))) AS employee,
    ISNULL(e.EmCity,'') AS city,ISNULL(p.PullDownPayrollCoOnSiteInitials,'') AS payroll,
    CAST(ISNULL(x.PayrollExclusionActive,0) AS BIT) AS active
  FROM dbo.tblPayrollExclusions x WITH (NOLOCK)
  LEFT JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=x.PayrollExclusionEmployeeID
  LEFT JOIN dbo.tblPullDownPayrollCoOnSite p WITH (NOLOCK) ON p.PullDownPayrollCoOnSiteID=x.PayrollExclusionPayrollCoOnSiteID
  ORDER BY e.EmLastName,e.EmFirstName,x.PayrollExclusionID`);
}

export interface NewsletterContactRow { id: string; source: string; first: string; last: string; email: string; noCommunication: boolean }
export function getNewsletterContactRows(): Promise<NewsletterContactRow[]> {
  return queryReadOnly<NewsletterContactRow>(`SELECT CAST(NewsletterContactID AS NVARCHAR(30)) AS id,
    ISNULL(NewsletterContactSource,'') AS source,ISNULL(NewsletterContactFirstName,'') AS first,
    ISNULL(NewsletterContactLastName,'') AS last,ISNULL(NewsletterContactEmail,'') AS email,
    CAST(ISNULL(NewsletterContactNoCommunication,0) AS BIT) AS noCommunication
  FROM dbo.tblNewsletterContacts WITH (NOLOCK)
  ORDER BY NewsletterContactSource,NewsletterContactFirstName,NewsletterContactEmail,
    NewsletterContactNoCommunication,NewsletterContactID`);
}

export interface NewsletterTemplate { id: string; label: string; subject: string; body: string }
export function getNewsletterTemplates(): Promise<NewsletterTemplate[]> {
  return queryReadOnly<NewsletterTemplate>(`SELECT CAST(EmailTemplateID AS NVARCHAR(30)) AS id,
    ISNULL(EmailTemplate,'') AS label,ISNULL(EmailTemplateSubject,'') AS subject,
    CONCAT(ISNULL(EmailTemplateMonthYear,''),ISNULL(EmailTemplateBody,''),
      ISNULL(EmailTemplateText1,''),ISNULL(EmailTemplateText2,''),ISNULL(EmailTemplateText3,''),ISNULL(EmailTemplateText4,'')) AS body
  FROM dbo.tblEmailTemplates WITH (NOLOCK) WHERE EmailTemplateType='Newsletter'
  ORDER BY EmailTemplateSort,EmailTemplateID`);
}

export interface VacationHoursRow {
  id: string; first: string; last: string; mi: string; payroll: string; year: number;
  perHr: number | null; start: string | null; vac: number | null; work: number | null;
  firstJob: string | null; firstWE: string | null; firstPayroll: string | null; lastPayroll: string | null;
  total: number; regular: number; ot: number; paid: number;
}
export function getTrackingYears(): Promise<number[]> {
  return queryReadOnly<{ year: number }>(`SELECT DISTINCT AssignYear AS year FROM dbo.tblTracking WITH (NOLOCK)
    WHERE AssignYear IS NOT NULL ORDER BY AssignYear DESC`).then(rows => rows.map(row => Number(row.year)));
}

/** Aggregate work rows by employee/payroll/year; expense rows must not count as worked hours. */
export function getVacationHoursRows(year: number): Promise<VacationHoursRow[]> {
  return queryReadOnly<VacationHoursRow>(`WITH work AS (
    SELECT EmployeeID,PayrollCoOnSiteID,
      MIN(WeekEndingDate) AS firstPayroll,MAX(WeekEndingDate) AS lastPayroll,
      SUM(ISNULL(TotalHours,0)) AS total,SUM(ISNULL(RegularHours,0)) AS regular,
      SUM(ISNULL(OvertimeHours,0)) AS ot
    FROM dbo.tblTracking WITH (NOLOCK)
    WHERE AssignYear=@year AND EmployeeID IS NOT NULL AND ExpenseTypeID IS NULL
    GROUP BY EmployeeID,PayrollCoOnSiteID
  ), first_work AS (
    SELECT EmployeeID,MIN(AssignmentTimestamp) AS firstJob,MIN(WeekEndingDate) AS firstWE
    FROM dbo.tblTracking WITH (NOLOCK) WHERE ExpenseTypeID IS NULL AND TotalHours>0
      AND WeekEndingDate<DATEFROMPARTS(@year+1,1,1) GROUP BY EmployeeID
  ), payroll_history AS (
    SELECT EmployeeID,PayrollCoOnSiteID,MIN(WeekEndingDate) AS firstPayroll,MAX(WeekEndingDate) AS lastPayroll
    FROM dbo.tblTracking WITH (NOLOCK) WHERE ExpenseTypeID IS NULL AND TotalHours>0
      AND WeekEndingDate<DATEFROMPARTS(@year+1,1,1) GROUP BY EmployeeID,PayrollCoOnSiteID
  ), paid AS (
    SELECT EmployeeID,EmployeeVacationHoursPayrollCoOnSiteID AS PayrollCoOnSiteID,
      SUM(ISNULL(EmployeeVacationHoursQuantity,0)) AS paid
    FROM dbo.tblEmployeeVacationHours WITH (NOLOCK)
    WHERE EmployeeVacationHoursWeekEndingPaid>=DATEFROMPARTS(@year,1,1)
      AND EmployeeVacationHoursWeekEndingPaid<DATEFROMPARTS(@year+1,1,1)
    GROUP BY EmployeeID,EmployeeVacationHoursPayrollCoOnSiteID
  )
  SELECT CONCAT(e.EmployeeID,'-',w.PayrollCoOnSiteID) AS id,
    ISNULL(e.EmFirstName,'') AS first,ISNULL(e.EmLastName,'') AS last,ISNULL(e.EmMiddle,'') AS mi,
    ISNULL(p.PullDownPayrollCoOnSiteInitials,'') AS payroll,@year AS year,
    e.CoExpVacationPerHr AS perHr,CONVERT(VARCHAR(10),e.VacationHoursStartDate,101) AS start,
    e.VacationHours AS vac,e.VacationHoursBlock AS work,
    CONVERT(VARCHAR(10),f.firstJob,101) AS firstJob,CONVERT(VARCHAR(10),f.firstWE,101) AS firstWE,
    CONVERT(VARCHAR(10),h.firstPayroll,101) AS firstPayroll,CONVERT(VARCHAR(10),h.lastPayroll,101) AS lastPayroll,
    w.total,w.regular,w.ot,ISNULL(v.paid,0) AS paid
  FROM work w JOIN dbo.tblEmployee e WITH (NOLOCK) ON e.EmployeeID=w.EmployeeID
  LEFT JOIN dbo.tblPullDownPayrollCoOnSite p WITH (NOLOCK) ON p.PullDownPayrollCoOnSiteID=w.PayrollCoOnSiteID
  LEFT JOIN first_work f ON f.EmployeeID=e.EmployeeID
  LEFT JOIN payroll_history h ON h.EmployeeID=e.EmployeeID AND h.PayrollCoOnSiteID=w.PayrollCoOnSiteID
  LEFT JOIN paid v ON v.EmployeeID=e.EmployeeID AND v.PayrollCoOnSiteID=w.PayrollCoOnSiteID
  WHERE e.VacationHoursStartDate IS NOT NULL OR ISNULL(e.VacationHours,0)<>0
    OR ISNULL(e.VacationHoursBlock,0)<>0 OR ISNULL(e.CoExpVacationPerHr,0)<>0 OR ISNULL(v.paid,0)<>0
  ORDER BY e.EmLastName,e.EmFirstName,p.PullDownPayrollCoOnSiteInitials`, [{ name: "year", value: year }]);
}

export interface TrackingWeekOption { value: string; label: string }
export function getTrackingWeekOptions(): Promise<TrackingWeekOption[]> {
  return queryReadOnly<TrackingWeekOption>(`SELECT DISTINCT CONVERT(VARCHAR(10),WeekEndingDate,23) AS value,
    CONVERT(VARCHAR(10),WeekEndingDate,101) AS label FROM dbo.tblTracking WITH (NOLOCK)
    WHERE WeekEndingDate IS NOT NULL ORDER BY value DESC`);
}

export interface TrackingSearchRow {
 id: string; customer: string; weekEnding: string; invoice: string; total: number | null; balance: number | null;
}
export function getTrackingSearchRows(weekEnding: string): Promise<TrackingSearchRow[]> {
 return queryReadOnly<TrackingSearchRow>(`SELECT CAST(cw.CustomerWeekID AS VARCHAR(30)) id,
 c.CustBusName customer,CONVERT(VARCHAR(10),cw.WeekEndingDate,101) weekEnding,
 cw.InvoiceNum invoice,cw.InvoiceTotal total,cw.OpenBalance balance
 FROM tblCustomerWeeks cw WITH (NOLOCK)
 JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=cw.CustomerID
 WHERE cw.WeekEndingDate>=CAST(@weekEnding AS DATE) AND cw.WeekEndingDate<DATEADD(DAY,1,CAST(@weekEnding AS DATE))
 ORDER BY c.CustBusName,cw.CustomerWeekID`,[{name:"weekEnding",value:weekEnding}]);
}

/** Company report compares the customer-week invoice records, preserving absent weeks. */
export function getTrackingWeekComparisonRows(current: string, previous: string): Promise<OperationalReportRow[]> {
 return queryReadOnly<OperationalReportRow>(`WITH last_week AS (
 SELECT CustomerWeekID,CustomerID,InvoiceNum FROM tblCustomerWeeks WITH (NOLOCK)
 WHERE WeekEndingDate>=CAST(@previous AS DATE) AND WeekEndingDate<DATEADD(DAY,1,CAST(@previous AS DATE))
 ), this_week AS (
 SELECT CustomerWeekID,CustomerID,InvoiceNum FROM tblCustomerWeeks WITH (NOLOCK)
 WHERE WeekEndingDate>=CAST(@current AS DATE) AND WeekEndingDate<DATEADD(DAY,1,CAST(@current AS DATE))
 ) SELECT CONCAT(ISNULL(p.CustomerWeekID,0),'-',ISNULL(n.CustomerWeekID,0)) id,
 CASE WHEN p.CustomerWeekID IS NOT NULL THEN c.CustBusName END AS [Last Week],p.InvoiceNum AS [Last Invoice],
 CASE WHEN n.CustomerWeekID IS NOT NULL THEN c.CustBusName END AS [This Week],n.InvoiceNum AS [This Invoice],
 LTRIM(RTRIM(CONCAT(s.PullDownSalesmanFName,' ',s.PullDownSalesmanLName))) Salesman
 FROM last_week p FULL OUTER JOIN this_week n ON n.CustomerID=p.CustomerID
 JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID=COALESCE(p.CustomerID,n.CustomerID)
 LEFT JOIN tblPullDownSalesman s WITH (NOLOCK) ON s.PullDownSalesmanID=c.SalesmanID
 ORDER BY c.CustBusName,p.CustomerWeekID,n.CustomerWeekID`,[{name:"current",value:current},{name:"previous",value:previous}]);
}
