import { queryReadOnly } from "@/lib/db/sql";
import { PAYROLL_CO_COLORS } from "@/lib/trackingConstants";
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
  limit?: number;
  customerId?: string;
  projectId?: string;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function money(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return "";
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
  const code = initials.slice(0, 3).toUpperCase();
  if (code && PAYROLL_CO_COLORS[code]) return PAYROLL_CO_COLORS[code];
  const id = Number(colorId);
  const palette = ["#888", "#e8913a", "#800080", "#008000", "#000080", "#808000", "#008080", "#ff0000"];
  if (Number.isFinite(id) && id > 0) return palette[id % palette.length];
  return "#888";
}

interface TrackingRow {
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
  TrackingID, EmployeeID, CustomerID, ProjectID,
  PayrollCoOnSiteInitials, PayrollCoOnSiteColorID, SiteName, PayrollInfoSent, Semus,
  JobApplicationStatusDesc, OSHA10StatusDesc, HealthInsuranceDesc,
  EmFirstName, EmMiddle, EmLastName, EmCity, EmMobilePhone, GradeChange, SiteState, WCC,
  ExpenseType, WccTracking, DirectionsSentEmail, DirectionsSentText, DirVerified, TrackMargin,
  SatHours, SunHours, MonHours, TueHours, WedHours, ThuHours, FriHours, TotalHours,
  SatStatusFlagID, SunStatusFlagID, MonStatusFlagID, TueStatusFlagID, WedStatusFlagID, ThuStatusFlagID, FriStatusFlagID,
  PayRate, BillRate, BillRateOT, HoursNote, AssignmentUserName, AssignmentTimestamp,
  HLinkTimesheetCV, HLinkTimesheetColorCV, SendLiveCheckColor,
  AutoTextUserName1, AutoTextTimestamp1, AutoTextUserName2, AutoTextTimestamp2,
  CoExpParkingPerHr, CustomerBusName, WeekEndingDate, Placeholder`;

function mapRow(r: TrackingRow): TrackingPreviewRow {
  const payrollCo = str(r.PayrollCoOnSiteInitials);
  const we = r.WeekEndingDate
    ? new Date(r.WeekEndingDate).toLocaleDateString("en-US")
    : "";

  return {
    employeeId: str(r.EmployeeID),
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
  const top = Math.max(1, Math.min(500, Math.floor(args.limit ?? 300)));
  const hasWeek = typeof args.week === "number" && typeof args.year === "number";
  const customerId = args.customerId?.trim() || null;
  const projectId = args.projectId?.trim() || null;

  const filterSql = `
    ${hasWeek ? "AND AssignWeek = @week AND AssignYear = @year" : ""}
    ${customerId ? "AND CAST(CustomerID AS NVARCHAR(20)) = @customerId" : ""}
    ${projectId ? "AND CAST(ProjectID AS NVARCHAR(20)) = @projectId" : ""}`;

  const params = [
    ...(hasWeek
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
        `SELECT TOP (${top}) ${SELECT_COLUMNS}
         FROM tblTracking WITH (NOLOCK)
         WHERE 1=1 ${filterSql}
         ORDER BY Placeholder ASC, EmLastName ASC, EmFirstName ASC`,
        params,
      );
      if (rows.length > 0) {
        return { rows: rows.map(mapRow), source: "tblTracking" };
      }
    }

    const recent = await queryReadOnly<TrackingRow>(
      `SELECT TOP (${top}) ${SELECT_COLUMNS}
       FROM tblTracking WITH (NOLOCK)
       ORDER BY AssignmentTimestamp DESC`,
    );
    return { rows: recent.map(mapRow), source: "tblTracking", fallback: hasWeek };
  } catch {
    return { rows: [], source: null };
  }
}

export async function getTrackingCustomerOptions(
  week: number,
  year: number,
): Promise<TrackingCustomerOption[]> {
  try {
    const rows = await queryReadOnly<{
      CustomerID: number;
      CustomerBusName: string;
      AssignmentCount: number;
    }>(
      `SELECT CustomerID,
              MAX(CustomerBusName) AS CustomerBusName,
              COUNT(*) AS AssignmentCount
       FROM tblTracking WITH (NOLOCK)
       WHERE AssignWeek = @week AND AssignYear = @year
         AND CustomerID IS NOT NULL
       GROUP BY CustomerID
       ORDER BY MAX(CustomerBusName)`,
      [
        { name: "week", value: week },
        { name: "year", value: year },
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
  customerId: string,
): Promise<TrackingJobOption[]> {
  try {
    const rows = await queryReadOnly<{ ProjectID: number; SiteName: string }>(
      `SELECT DISTINCT ProjectID, SiteName
       FROM tblTracking WITH (NOLOCK)
       WHERE AssignWeek = @week AND AssignYear = @year
         AND CAST(CustomerID AS NVARCHAR(20)) = @customerId
         AND ProjectID IS NOT NULL
       ORDER BY SiteName`,
      [
        { name: "week", value: week },
        { name: "year", value: year },
        { name: "customerId", value: customerId },
      ],
    );
    return rows.map((r) => ({
      projectId: str(r.ProjectID),
      label: str(r.SiteName) || `Job #${r.ProjectID}`,
    }));
  } catch {
    return [];
  }
}

export async function getTrackingJobInfo(
  customerId: string,
): Promise<TrackingJobInfo | null> {
  try {
    const rows = await queryReadOnly<{
      CustBusName: string;
      ContractDate: string | Date | null;
      SalesmanID: number | null;
      ContractWithName: string | null;
      WCxDate: string | Date | null;
      GLxDate: string | Date | null;
      CreditLimit: number | null;
    }>(
      `SELECT TOP (1)
         ISNULL(c.CustBusName, '') AS CustBusName,
         c.ContractDate,
         c.SalesmanID,
         ISNULL(p.PullDownContractWith_PayrollCoName, '') AS ContractWithName,
         c.WCxDate,
         c.GLxDate,
         c.CreditLimit
       FROM tblCustomer c WITH (NOLOCK)
       LEFT JOIN tblPullDownContractWith_PayrollCo p WITH (NOLOCK)
         ON c.CustContractWith_PayrollCoID = p.PullDownContractWith_PayrollCoID
       WHERE CAST(c.CustomerID AS NVARCHAR(20)) = @customerId`,
      [{ name: "customerId", value: customerId }],
    );
    const c = rows[0];
    if (!c) return null;

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
                ISNULL(PullDownReferralAgencyName, '') AS ReferralAgencyName
         FROM tblPullDownReferralAgency WITH (NOLOCK)
         ORDER BY PullDownReferralAgencyName`,
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
      contractWith: str(c.ContractWithName),
      contractDate: fmtDate(c.ContractDate),
      salesman: str(c.SalesmanID),
      creditHistory: c.CreditLimit ? money(c.CreditLimit) : "",
      oldestInvoice: "",
      totalOwed: "",
      w9OnFile: "",
      wcDate: fmtDate(c.WCxDate),
      glDate: fmtDate(c.GLxDate),
      tia: "",
      cpm: "",
      estimatedInvoice: "",
      billRates: rates.map((r) => ({
        grade: str(r.BillRateGrade),
        rate: money(r.BillRate),
      })),
      marginRows: Array.from({ length: 5 }, () => ({ total: "", margin: "" })),
      contacts,
      salesmen,
      referralAgencies,
    };
  } catch {
    return null;
  }
}
