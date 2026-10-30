import { queryReadOnly } from "@/lib/db/sql";
import { PAYROLL_CO_COLORS, PAYROLL_COLOR_IDS } from "@/lib/trackingConstants";
import type {
  TrackingPreview,
  TrackingPreviewRow,
  TrackingCustomerOption,
  TrackingJobOption,
  TrackingJobInfo,
  TrackingJobContact,
  TrackingSalesmanOption,
  TrackingReferralAgency,
} from "@/types/tracking";

interface GetTrackingPreviewArgs {
  week?: number;
  year?: number;
  weekEndingDate?: string;
  customerId?: string;
  projectId?: string;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function money(v: unknown, includeZero = false): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n) || (n === 0 && !includeZero)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function hours(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "";
  return String(Math.round(n * 100) / 100);
}

function fixed(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

function bool(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => x === true || x === 1 || x === -1);
  return v === true || v === 1 || v === -1;
}

function mark(v: unknown): string {
  return bool(v) ? "X" : "";
}

function ts(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return str(v);
  return d.toLocaleString("en-US");
}

function payrollColor(initials: string, colorId: unknown): string {
  if (PAYROLL_COLOR_IDS[Number(colorId)]) return PAYROLL_COLOR_IDS[Number(colorId)];
  const code = initials.slice(0, 3).toUpperCase();
  if (code && PAYROLL_CO_COLORS[code]) return PAYROLL_CO_COLORS[code];
  const id = Number(colorId);
  const palette = ["#888", "#e8913a", "#800080", "#008000", "#000080", "#808000", "#008080", "#ff0000"];
  if (Number.isFinite(id) && id > 0) return palette[id % palette.length];
  return "#888";
}

interface TrackingRow {
  InvoiceAmount: number | null;
  WccTrackingProfit: number | null;
  Grade: string | null;
  PayrollChangeColor: string | null;
  EmployeeID: number | null;
  PayrollCoOnSiteInitials: string | null;
  PayrollCoOnSiteColorID: number | null;
  SiteName: string | null;
  PayrollInfoSent: unknown;
  Semus: string | null;
  JobApplicationStatusDesc: string | null;
  OSHA10StatusDesc: string | null;
  HealthInsuranceDesc: string | null;
  EmFirstName: string | null;
  EmMiddle: string | null;
  EmLastName: string | null;
  EmCity: string | null;
  EmMobilePhone: string | null;
  GradeChange: string | null;
  SiteState: string | null;
  WCC: string | null;
  ExpenseType: string | null;
  WccTracking: number | null;
  DirectionsSentEmail: unknown;
  DirectionsSentText: unknown;
  DirVerified: unknown;
  TrackMargin: number | null;
  SatHours: number | null;
  SunHours: number | null;
  MonHours: number | null;
  TueHours: number | null;
  WedHours: number | null;
  ThuHours: number | null;
  FriHours: number | null;
  TotalHours: number | null;
  PayRate: number | null;
  BillRate: number | null;
  BillRateOT: number | null;
  HoursNote: string | null;
  AssignmentUserName: string | null;
  AssignmentTimestamp: string | Date | null;
  HLinkTimesheetCV: string | null;
  HLinkTimesheetColorCV: string | null;
  SendLiveCheckColor: string | null;
  AutoTextUserName1: string | null;
  AutoTextTimestamp1: string | Date | null;
  AutoTextUserName2: string | null;
  AutoTextTimestamp2: string | Date | null;
  CoExpParkingPerHr: number | null;
  CoExpHealthInsPerHr: number | null;
  CoExpTravelPerHr: number | null;
  CoExpVacationPerHr: number | null;
  AccumulatedReferral: number | null;
  AccumulatedReferralStartDate: string | Date | null;
  BonusExpenseRecipient: string | null;
  EmployeeReferralRatePerHr: number | null;
  TrackMarginCostPerHr: number | null;
  SickTime: number | null;
  CoExpSchoolingPerHr: number | null;
  CoExpToolsPerHr: number | null;
  CustomerBusName: string | null;
  WeekEndingDate: string | Date | null;
  Placeholder: boolean | null;
  CustomerID: number | null;
  ProjectID: number | null;
  SatStatusFlagID: number | null;
  SunStatusFlagID: number | null;
  MonStatusFlagID: number | null;
  TueStatusFlagID: number | null;
  WedStatusFlagID: number | null;
  ThuStatusFlagID: number | null;
  FriStatusFlagID: number | null;
}

const SELECT_COLUMNS = `
  TrackingID, EmployeeID, CustomerID, ProjectID, Grade, PayrollChangeColor, InvoiceAmount, WccTrackingProfit,
  PayrollCoOnSiteInitials, PayrollCoOnSiteColorID, SiteName, PayrollInfoSent, Semus,
  JobApplicationStatusDesc, OSHA10StatusDesc, HealthInsuranceDesc,
  EmFirstName, EmMiddle, EmLastName, EmCity, EmMobilePhone, GradeChange, SiteState, WCC,
  ExpenseType, WccTracking, DirectionsSentEmail, DirectionsSentText, DirVerified, TrackMargin,
  SatHours, SunHours, MonHours, TueHours, WedHours, ThuHours, FriHours, TotalHours,
  SatStatusFlagID, SunStatusFlagID, MonStatusFlagID, TueStatusFlagID, WedStatusFlagID, ThuStatusFlagID, FriStatusFlagID,
  PayRate, BillRate, BillRateOT, HoursNote, AssignmentUserName, AssignmentTimestamp,
  HLinkTimesheetCV, HLinkTimesheetColorCV, SendLiveCheckColor,
  AutoTextUserName1, AutoTextTimestamp1, AutoTextUserName2, AutoTextTimestamp2,
  CoExpParkingPerHr, SickTime, CoExpSchoolingPerHr, CoExpToolsPerHr,
  CoExpHealthInsPerHr, CoExpTravelPerHr, CoExpVacationPerHr,
  AccumulatedReferral, AccumulatedReferralStartDate, EmployeeReferralRatePerHr, TrackMarginCostPerHr,
  (SELECT LTRIM(RTRIM(CONCAT(bonusRecipient.EmFirstName,' ',NULLIF(bonusRecipient.EmMiddle,'')+' ',bonusRecipient.EmLastName)))
   FROM tblEmployee bonusRecipient WITH (NOLOCK)
   WHERE bonusRecipient.EmployeeID=tblTracking.AccumulatedReferralEmployeeID) AS BonusExpenseRecipient,
  CustomerBusName, WeekEndingDate, Placeholder`;

function mapRow(r: TrackingRow): TrackingPreviewRow {
  const payrollCo = str(r.PayrollCoOnSiteInitials);
  const we = r.WeekEndingDate
    ? new Date(r.WeekEndingDate).toLocaleDateString("en-US")
    : "";

  return {
    employeeId: str(r.EmployeeID),
    invoiceAmount: Number(r.InvoiceAmount ?? 0),
    trackingProfitAmount: Number(r.WccTrackingProfit ?? 0),
    grade: str(r.Grade),
    payrollChangePending: r.PayrollChangeColor !== null && r.PayrollChangeColor !== undefined,
    customerId: str(r.CustomerID),
    projectId: str(r.ProjectID),
    payrollCo,
    payrollCoColor: payrollColor(payrollCo, r.PayrollCoOnSiteColorID),
    jobSite: str(r.SiteName),
    infoSent: mark(r.PayrollInfoSent),
    semus: str(r.Semus),
    jobApp: str(r.JobApplicationStatusDesc),
    osha: str(r.OSHA10StatusDesc),
    health: str(r.HealthInsuranceDesc),
    firstName: str(r.EmFirstName),
    middleInitial: str(r.EmMiddle),
    lastName: str(r.EmLastName),
    city: str(r.EmCity),
    cell: str(r.EmMobilePhone),
    gradeChange: str(r.GradeChange),
    wccState: str(r.SiteState),
    wcc: str(r.WCC),
    perDiem: str(r.ExpenseType),
    oh: fixed(r.WccTracking),
    directionsEmail: mark(r.DirectionsSentEmail),
    directionsText: mark(r.DirectionsSentText),
    dirVerified: mark(r.DirVerified),
    trackMargin: fixed(r.TrackMargin),
    satHours: hours(r.SatHours),
    sunHours: hours(r.SunHours),
    monHours: hours(r.MonHours),
    tueHours: hours(r.TueHours),
    wedHours: hours(r.WedHours),
    thuHours: hours(r.ThuHours),
    friHours: hours(r.FriHours),
    payRate: money(r.PayRate),
    billRate: money(r.BillRate),
    billRateOT: money(r.BillRateOT),
    hoursNote: str(r.HoursNote),
    assignmentUser: str(r.AssignmentUserName),
    assignmentTimestamp: ts(r.AssignmentTimestamp),
    hlCv: str(r.HLinkTimesheetCV),
    hlCvColor: str(r.HLinkTimesheetColorCV),
    sendAutoText: mark(r.DirectionsSentText) || str(r.SendLiveCheckColor),
    hrsAutoTextUser: str(r.AutoTextUserName1),
    hrsAutoTextTimestamp: ts(r.AutoTextTimestamp1),
    hlAutoTextUser: str(r.AutoTextUserName2),
    hlAutoTextTimestamp: ts(r.AutoTextTimestamp2),
    parkingPerHr: money(r.CoExpParkingPerHr),
    healthInsPerHr: money(r.CoExpHealthInsPerHr),
    travelPerHr: money(r.CoExpTravelPerHr),
    vacationPerHr: money(r.CoExpVacationPerHr),
    bonusExpenseRate: money(r.AccumulatedReferral),
    bonusExpenseStartDate: r.AccumulatedReferralStartDate
      ? new Date(r.AccumulatedReferralStartDate).toLocaleDateString("en-US", { timeZone: "UTC" }) : "",
    bonusExpenseRecipient: str(r.BonusExpenseRecipient),
    employeeReferralPerHr: money(r.EmployeeReferralRatePerHr),
    marginCostPerHr: money(r.TrackMarginCostPerHr),
    sickTime: money(r.SickTime, true),
    schoolingPerHr: money(r.CoExpSchoolingPerHr),
    toolsPerHr: money(r.CoExpToolsPerHr),
    customer: str(r.CustomerBusName),
    totalHours: hours(r.TotalHours),
    weekEnding: we,
    placeholder: r.Placeholder === true,
    dayFlags: [
      str(r.SatStatusFlagID),
      str(r.SunStatusFlagID),
      str(r.MonStatusFlagID),
      str(r.TueStatusFlagID),
      str(r.WedStatusFlagID),
      str(r.ThuStatusFlagID),
      str(r.FriStatusFlagID),
    ],
  };
}

export async function getTrackingPreview(
  args: GetTrackingPreviewArgs = {},
): Promise<TrackingPreview> {
  const top = 300;
  // Access loads the tracking form by the selected Friday's WeekEndingDate.
  // AssignWeek/AssignYear can be stale on older records, so filtering only by
  // those calculated fields can repeat the same rows across multiple weeks.
  const hasWeek = Boolean(args.weekEndingDate) ||
    (typeof args.week === "number" && typeof args.year === "number");
  const customerId = args.customerId?.trim() || null;
  const projectId = args.projectId?.trim() || null;

  const filterSql = `
    ${args.weekEndingDate
      ? "AND WeekEndingDate >= CAST(@weekEndingDate AS DATE) AND WeekEndingDate < DATEADD(DAY, 1, CAST(@weekEndingDate AS DATE))"
      : hasWeek
        ? "AND AssignWeek = @week AND AssignYear = @year"
        : ""}
    ${customerId ? "AND CAST(CustomerID AS NVARCHAR(20)) = @customerId" : ""}
    ${projectId ? "AND CAST(ProjectID AS NVARCHAR(20)) = @projectId" : ""}`;

  const params = [
    ...(args.weekEndingDate
      ? [{ name: "weekEndingDate", value: args.weekEndingDate }]
      : hasWeek
        ? [
            { name: "week", value: args.week },
            { name: "year", value: args.year },
          ]
        : []),
    ...(customerId ? [{ name: "customerId", value: customerId }] : []),
    ...(projectId ? [{ name: "projectId", value: projectId }] : []),
  ];

  try {
    if (hasWeek || customerId || projectId) {
      const rows = await queryReadOnly<TrackingRow>(
        `SELECT ${hasWeek ? "" : `TOP (${top}) `}${SELECT_COLUMNS}
         FROM tblTracking WITH (NOLOCK)
         WHERE 1=1 ${filterSql}
         ORDER BY Placeholder ASC, EmLastName ASC, EmFirstName ASC`,
        params,
      );
      // A requested work week is strict: an empty week must remain empty rather
      // than showing recent assignments from a different week.
      if (hasWeek) return { rows: rows.map(mapRow), source: "tblTracking" };
      if (rows.length > 0) return { rows: rows.map(mapRow), source: "tblTracking" };
    }

    const recent = await queryReadOnly<TrackingRow>(
      `SELECT TOP (${top}) ${SELECT_COLUMNS}
       FROM tblTracking WITH (NOLOCK)
       ORDER BY AssignmentTimestamp DESC`,
    );
    return { rows: recent.map(mapRow), source: "tblTracking" };
  } catch (error) {
    console.error("[tracking] Unable to load assignments:", error);
    return { rows: [], source: null, error: "The tracking assignments could not be loaded from SQL Server." };
  }
}

export async function getTrackingCustomerOptions(
  week: number,
  year: number,
  weekEndingDate?: string,
): Promise<TrackingCustomerOption[]> {
  try {
    const rows = await queryReadOnly<{
      CustomerID: number;
      CustomerBusName: string;
      AssignmentCount: number;
    }>(
      `SELECT c.CustomerID,
              ISNULL(c.CustBusName, '') AS CustomerBusName,
              COUNT(t.TrackingID) AS AssignmentCount
       FROM tblCustomer c WITH (NOLOCK)
       INNER JOIN tblTracking t WITH (NOLOCK)
         ON t.CustomerID = c.CustomerID
        AND ${weekEndingDate
          ? "t.WeekEndingDate >= CAST(@weekEndingDate AS DATE) AND t.WeekEndingDate < DATEADD(DAY, 1, CAST(@weekEndingDate AS DATE))"
          : "t.AssignWeek = @week AND t.AssignYear = @year"}
       GROUP BY c.CustomerID, c.CustBusName
       ORDER BY ISNULL(c.CustBusName, ''), c.CustomerID`,
      [
        ...(weekEndingDate
          ? [{ name: "weekEndingDate", value: weekEndingDate }]
          : [{ name: "week", value: week }, { name: "year", value: year }]),
      ],
    );
    return rows.map((r) => ({
      customerId: str(r.CustomerID),
      label: str(r.CustomerBusName) || `Customer #${r.CustomerID}`,
      rowCount: r.AssignmentCount ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getTrackingJobOptions(
  week: number,
  year: number,
  customerId?: string,
  weekEndingDate?: string,
): Promise<TrackingJobOption[]> {
  try {
    const rows = await queryReadOnly<{
      ProjectID: number;
      CustomerID: number;
      CustomerBusName: string;
      SiteName: string;
    }>(
      `SELECT p.ProjectID, p.CustomerID,
              ISNULL(c.CustBusName, '') AS CustomerBusName,
              ISNULL(p.SiteName, '') AS SiteName
       FROM tblProject p WITH (NOLOCK)
       INNER JOIN tblCustomer c WITH (NOLOCK) ON c.CustomerID = p.CustomerID
       INNER JOIN tblTracking t WITH (NOLOCK)
         ON t.ProjectID = p.ProjectID
        AND t.CustomerID = p.CustomerID
        AND ${weekEndingDate
          ? "t.WeekEndingDate >= CAST(@weekEndingDate AS DATE) AND t.WeekEndingDate < DATEADD(DAY, 1, CAST(@weekEndingDate AS DATE))"
          : "t.AssignWeek = @week AND t.AssignYear = @year"}
       WHERE (@customerId = '' OR CAST(p.CustomerID AS NVARCHAR(20)) = @customerId)
       GROUP BY p.ProjectID, p.CustomerID, c.CustBusName, p.SiteName
       ORDER BY ISNULL(c.CustBusName, ''), ISNULL(p.SiteName, ''), p.ProjectID`,
      [
        ...(weekEndingDate
          ? [{ name: "weekEndingDate", value: weekEndingDate }]
          : [{ name: "week", value: week }, { name: "year", value: year }]),
        { name: "customerId", value: customerId ?? "" },
      ],
    );
    return rows.map((r) => ({
      projectId: str(r.ProjectID),
      customerId: str(r.CustomerID),
      label: customerId
        ? str(r.SiteName) || `Job #${r.ProjectID}`
        : `${str(r.CustomerBusName) || `Customer #${r.CustomerID}`} · ${str(r.SiteName) || `Job #${r.ProjectID}`}`,
    }));
  } catch {
    return [];
  }
}

export async function getTrackingJobInfo(
  customerId: string,
  projectId?: string,
  week?: number,
  year?: number,
  weekEndingDate?: string,
): Promise<TrackingJobInfo | null> {
  try {
    const suffixByPayrollCode: Record<string, string> = {
      AMP: "AMP", HDE: "HDE", HSG: "HSG", IPG: "IPG", ISG: "ISG", MLS: "MLS", "T&R": "T_R",
    };
    let documentSuffix = "";
    if (projectId && typeof week === "number" && typeof year === "number") {
      const payrollRows = await queryReadOnly<{ PayrollCode: string | null }>(
        `SELECT TOP (1) ISNULL(pc.PullDownPayrollCoOnSiteInitials, '') AS PayrollCode
         FROM tblTracking t WITH (NOLOCK)
         LEFT JOIN tblPullDownPayrollCoOnSite pc WITH (NOLOCK)
           ON pc.PullDownPayrollCoOnSiteID = t.PayrollCoOnSiteID
         WHERE t.CustomerID = @customerId AND t.ProjectID = @projectId
           AND ${weekEndingDate
             ? "t.WeekEndingDate >= CAST(@weekEndingDate AS DATE) AND t.WeekEndingDate < DATEADD(DAY, 1, CAST(@weekEndingDate AS DATE))"
             : "t.AssignWeek = @week AND t.AssignYear = @year"}
         ORDER BY t.AssignmentTimestamp DESC, t.TrackingID DESC`,
        [
          { name: "customerId", value: Number(customerId) },
          { name: "projectId", value: Number(projectId) },
          ...(weekEndingDate
            ? [{ name: "weekEndingDate", value: weekEndingDate }]
            : [{ name: "week", value: week }, { name: "year", value: year }]),
        ],
      ).catch(() => []);
      const code = str(payrollRows[0]?.PayrollCode).trim().toUpperCase();
      documentSuffix = suffixByPayrollCode[code] ?? "";
    }
    const rows = await queryReadOnly<{
      CustBusName: string;
      CustomerNote: string | null;
      SalesmanID: number | null;
      ContractWithName: string | null;
      CreditLimit: number | null;
      SalesmanName: string | null;
      OldestInvoice: string | Date | null;
      TotalOwed: number | null;
    }>(
      `SELECT TOP (1)
         ISNULL(c.CustBusName, '') AS CustBusName,
         c.CustomerNote,
         c.SalesmanID,
         ISNULL(p.PullDownContractWith_PayrollCoName, '') AS ContractWithName,
         c.CreditLimit,
         inv.OldestInvoice,
         inv.TotalOwed,
         LTRIM(RTRIM(ISNULL(s.PullDownSalesmanFName, '') + ' ' + ISNULL(s.PullDownSalesmanLName, ''))) AS SalesmanName
       FROM tblCustomer c WITH (NOLOCK)
       LEFT JOIN tblPullDownContractWith_PayrollCo p WITH (NOLOCK)
         ON c.CustContractWith_PayrollCoID = p.PullDownContractWith_PayrollCoID
       LEFT JOIN tblPullDownSalesman s WITH (NOLOCK)
         ON c.SalesmanID = s.PullDownSalesmanID
       OUTER APPLY (
         SELECT MIN(CASE WHEN ISNULL(cw.OpenBalance, 0) > 0 THEN cw.WeekEndingDate END) AS OldestInvoice,
                SUM(CASE WHEN ISNULL(cw.OpenBalance, 0) > 0 THEN cw.OpenBalance ELSE 0 END) AS TotalOwed
         FROM tblCustomerWeeks cw WITH (NOLOCK)
         WHERE cw.CustomerID = c.CustomerID
       ) inv
       WHERE CAST(c.CustomerID AS NVARCHAR(20)) = @customerId`,
      [{ name: "customerId", value: customerId }],
    );
    const c = rows[0];
    if (!c) return null;

    // Keep optional document fields out of the core customer lookup. Access
    // stores these links in payroll-company-specific columns; a missing legacy
    // column must not blank the customer summary fields above.
    // NULLIF requires a typed first argument, even when no company is selected.
    // An untyped NULL makes SQL reject the entire document lookup.
    const suffixField = (base: string) => documentSuffix
      ? `c.[${base}${documentSuffix}]`
      : base.startsWith("HLink") ? "CAST(NULL AS NVARCHAR(MAX))" : "CAST(NULL AS DATETIME2)";
    const contractLink = `COALESCE(NULLIF(${suffixField("HLinkSalesContract")}, ''), c.HLinkSalesContract, '')`;
    const w9Link = `COALESCE(NULLIF(${suffixField("HLinkW9")}, ''), c.HLinkW9, '')`;
    const wcLink = `COALESCE(NULLIF(${suffixField("HLinkWCxDate")}, ''), c.HLinkWCxDate, '')`;
    const glLink = `COALESCE(NULLIF(${suffixField("HLinkGLxDate")}, ''), c.HLinkGLxDate, '')`;
    const wcDate = `COALESCE(${suffixField("WCxDate")}, c.WCxDate)`;
    const glDate = `COALESCE(${suffixField("GLxDate")}, c.GLxDate)`;
    const customerDocumentRows = await queryReadOnly<{
      ContractDate: string | Date | null;
      ContractLink: string | null;
      W9Link: string | null;
      WCLink: string | null;
      GLLink: string | null;
      WCDate: string | Date | null;
      GLDate: string | Date | null;
    }>(
      `SELECT TOP (1) c.ContractDate,
              ${wcDate} AS WCDate, ${glDate} AS GLDate,
              ${contractLink} AS ContractLink, ${w9Link} AS W9Link,
              ${wcLink} AS WCLink, ${glLink} AS GLLink
       FROM tblCustomer c WITH (NOLOCK)
       WHERE CAST(c.CustomerID AS NVARCHAR(20)) = @customerId`,
      [{ name: "customerId", value: customerId }],
    ).catch(() => []);
    const docs = customerDocumentRows[0];

    const summaryParams = [
      { name: "customerId", value: Number(customerId) },
      { name: "projectId", value: projectId ? Number(projectId) : null },
      { name: "weekEndingDate", value: weekEndingDate ?? null },
      { name: "week", value: week ?? null },
      { name: "year", value: year ?? null },
    ];
    const [summaryRows, marginHistory] = await Promise.all([
      queryReadOnly<{ Total: number | null; Profit: number | null }>(`SELECT
        SUM(ISNULL(InvoiceAmount,0)) AS Total, SUM(ISNULL(WccTrackingProfit,0)) AS Profit
        FROM tblTracking WITH (NOLOCK)
        WHERE CustomerID=@customerId AND (@projectId IS NULL OR ProjectID=@projectId)
          AND ((@weekEndingDate IS NOT NULL AND WeekEndingDate>=CAST(@weekEndingDate AS DATE)
            AND WeekEndingDate<DATEADD(day,1,CAST(@weekEndingDate AS DATE)))
          OR (@weekEndingDate IS NULL AND AssignWeek=@week AND AssignYear=@year))`, summaryParams),
      queryReadOnly<{ Total: number | null; Profit: number | null; WeekEnding: string }>(`SELECT
        CONVERT(VARCHAR(10),WeekEndingDate,101) AS WeekEnding,
        SUM(ISNULL(InvoiceAmount,0)) AS Total, SUM(ISNULL(WccTrackingProfit,0)) AS Profit
        FROM tblTracking WITH (NOLOCK) WHERE CustomerID=@customerId
        GROUP BY WeekEndingDate ORDER BY WeekEndingDate`, [{ name: "customerId", value: Number(customerId) }]),
    ]);
    const summary = summaryRows[0];

    const rates = await queryReadOnly<{ BillRateGrade: string; BillRate: number }>(
      `SELECT TOP (8)
         ISNULL(BillRateGrade, '') AS BillRateGrade,
         BillRate
       FROM tblCustomerBillRates WITH (NOLOCK)
       WHERE CAST(CustomerID AS NVARCHAR(20)) = @customerId
         AND BillRateActive = 1
       ORDER BY BillRateSort, BillRateGrade`,
      [{ name: "customerId", value: customerId }],
    );

    const projectRows = projectId
      ? await queryReadOnly<{
          SiteName: string | null;
          SiteStreet: string | null;
          SiteCity: string | null;
          SiteState: string | null;
          SiteZip: string | null;
          ProjNote: string | null;
          SiteHyperlink: string | null;
        }>(
          `SELECT TOP (1)
             ISNULL(p.SiteName, '') AS SiteName,
             ISNULL(p.SiteStreet, '') AS SiteStreet,
             ISNULL(sc.City, '') AS SiteCity,
             ISNULL(st.PullDownState, '') AS SiteState,
             ISNULL(p.SiteZip, '') AS SiteZip,
             ISNULL(p.ProjNote, '') AS ProjNote,
             ISNULL(p.SiteHyperlink, '') AS SiteHyperlink
           FROM tblProject p WITH (NOLOCK)
           LEFT JOIN tblPullDownStateCities sc WITH (NOLOCK)
             ON p.SiteStateCityID = sc.PullDownStateCityID
           LEFT JOIN tblPullDownStates st WITH (NOLOCK)
             ON sc.StateID = st.PullDownStateID
           WHERE CAST(p.CustomerID AS NVARCHAR(20)) = @customerId
             AND CAST(p.ProjectID AS NVARCHAR(20)) = @projectId`,
          [
            { name: "customerId", value: customerId },
            { name: "projectId", value: projectId },
          ],
        ).catch(() => [])
      : [];
    const project = projectRows[0];

    const [contactRows, salesmanRows, referralRows] = await Promise.all([
      queryReadOnly<{
        CustomerContactFName: string;
        CustomerContactLName: string;
        CustomerContactEmail: string;
        CustomerContactCell: string;
        CustomerContactOfficePhone: string;
        CustomerContactNotes: string;
        CustomerContactSort: number | null;
      }>(
        `SELECT
           ISNULL(CustomerContactFName, '') AS CustomerContactFName,
           ISNULL(CustomerContactLName, '') AS CustomerContactLName,
           ISNULL(CustomerContactEmail, '') AS CustomerContactEmail,
           ISNULL(CustomerContactCell, '') AS CustomerContactCell,
           ISNULL(CustomerContactOfficePhone, '') AS CustomerContactOfficePhone,
           ISNULL(CustomerContactNotes, '') AS CustomerContactNotes,
           CustomerContactSort
         FROM tblCustomerContacts WITH (NOLOCK)
         WHERE CAST(CustomerID AS NVARCHAR(20)) = @customerId
         ORDER BY CustomerContactSort, CustomerContactLName, CustomerContactFName`,
        [{ name: "customerId", value: customerId }],
      ).catch(() => []),
      queryReadOnly<{ PullDownSalesmanID: unknown; SalesmanLabel: string | null }>(
        `SELECT PullDownSalesmanID,
                LTRIM(RTRIM(
                  ISNULL(PullDownSalesmanFName, '') + ' ' + ISNULL(PullDownSalesmanLName, '')
                )) AS SalesmanLabel
         FROM tblPullDownSalesman WITH (NOLOCK)
         ORDER BY PullDownSalesmanLName, PullDownSalesmanFName`,
      ).catch(() => []),
      queryReadOnly<{ PullDownReferralAgencyID: unknown; ReferralAgencyName: string | null }>(
        `SELECT PullDownReferralAgencyID,
                ISNULL(PullDownReferralAgency, '') AS ReferralAgencyName
         FROM tblPullDownReferralAgencies WITH (NOLOCK)
         ORDER BY PullDownReferralAgency`,
      ).catch(() => []),
    ]);

    const contacts: TrackingJobContact[] = contactRows.map((r) => ({
      firstName: str(r.CustomerContactFName),
      lastName: str(r.CustomerContactLName),
      title: "",
      email: str(r.CustomerContactEmail),
      cell: str(r.CustomerContactCell),
      officePhone: str(r.CustomerContactOfficePhone),
      notes: str(r.CustomerContactNotes),
      sort: r.CustomerContactSort != null ? String(r.CustomerContactSort) : "",
    }));

    const salesmen: TrackingSalesmanOption[] = salesmanRows
      .filter((r) => r.PullDownSalesmanID != null && str(r.SalesmanLabel))
      .map((r) => ({
        id: String(r.PullDownSalesmanID),
        name: str(r.SalesmanLabel),
      }));

    const referralAgencies: TrackingReferralAgency[] = referralRows
      .filter((r) => r.PullDownReferralAgencyID != null && str(r.ReferralAgencyName))
      .map((r) => ({
        id: String(r.PullDownReferralAgencyID),
        name: str(r.ReferralAgencyName),
      }));

    const fmtDate = (v: string | Date | null) =>
      v ? new Date(v).toLocaleDateString("en-US") : "";

    return {
      customerName: str(c.CustBusName),
      customerNote: str(c.CustomerNote),
      projectName: str(project?.SiteName),
      siteAddress: [
        str(project?.SiteStreet),
        [str(project?.SiteCity), str(project?.SiteState)].filter(Boolean).join(", "),
        str(project?.SiteZip),
      ].filter(Boolean).join(" "),
      projectNotes: str(project?.ProjNote),
      contractWith: str(c.ContractWithName),
      contractDate: fmtDate(docs?.ContractDate ?? null),
      salesman: str(c.SalesmanName) || str(c.SalesmanID),
      creditHistory: c.CreditLimit ? money(c.CreditLimit) : "",
      oldestInvoice: fmtDate(c.OldestInvoice),
      totalOwed: c.TotalOwed ? money(c.TotalOwed) : "",
      w9OnFile: str(docs?.W9Link) ? "On file" : "Not on file",
      wcDate: fmtDate(docs?.WCDate ?? null),
      glDate: fmtDate(docs?.GLDate ?? null),
      documentLinks: {
        contract: str(docs?.ContractLink),
        w9: str(docs?.W9Link),
        wc: str(docs?.WCLink),
        gl: str(docs?.GLLink),
        site: str(project?.SiteHyperlink),
      },
      tia: `$${money(summary?.Total ?? 0, true)}`,
      trackingProfit: `$${money(summary?.Profit ?? 0, true)}`,
      cpm: summary?.Total ? `${((summary.Profit ?? 0) / summary.Total * 100).toFixed(2)}%` : "",
      estimatedInvoice: "",
      billRates: rates.map((r) => ({
        grade: str(r.BillRateGrade),
        rate: money(r.BillRate),
      })),
      marginRows: marginHistory.map(row => ({ total: `$${money(row.Total ?? 0, true)}`, margin: row.Total ? `${((row.Profit ?? 0) / row.Total * 100).toFixed(2)}%` : "", weekEnding: row.WeekEnding })),
      contacts,
      salesmen,
      referralAgencies,
    };
  } catch {
    return null;
  }
}

/** Referral choices belong to the tracking form, independent of the selected customer. */
export async function getTrackingReferralAgencies(): Promise<TrackingReferralAgency[]> {
  const rows = await queryReadOnly<{ PullDownReferralAgencyID: unknown; ReferralAgencyName: string | null }>(
    `SELECT PullDownReferralAgencyID, ISNULL(PullDownReferralAgency, '') AS ReferralAgencyName
     FROM tblPullDownReferralAgencies WITH (NOLOCK)
     ORDER BY PullDownReferralAgency`,
  );
  return rows.filter(row => row.PullDownReferralAgencyID != null && str(row.ReferralAgencyName))
    .map(row => ({ id: String(row.PullDownReferralAgencyID), name: str(row.ReferralAgencyName) }));
}
/** Salesman choices are available before selecting a tracking customer. */
export async function getTrackingSalesmen(): Promise<TrackingSalesmanOption[]> {
  const rows = await queryReadOnly<{ PullDownSalesmanID: unknown; SalesmanLabel: string | null }>(
    `SELECT PullDownSalesmanID,
       LTRIM(RTRIM(ISNULL(PullDownSalesmanFName, '') + ' ' + ISNULL(PullDownSalesmanLName, ''))) AS SalesmanLabel
     FROM tblPullDownSalesman WITH (NOLOCK)
     ORDER BY PullDownSalesmanLName, PullDownSalesmanFName`,
  );
  return rows.filter(row => row.PullDownSalesmanID != null && str(row.SalesmanLabel))
    .map(row => ({ id: String(row.PullDownSalesmanID), name: str(row.SalesmanLabel) }));
}