import { queryReadOnly } from "@/lib/db/sql";
import { loadEmployeeDefaultFields } from "@/lib/employeeSearchDefaultFields";
import type {
  EmployeeSummary,
  EmployeeDetail,
  EmployeeRow,
  EmployeeBRow,
  EmployeeRateRow,
  EmployeeContactRow,
  EmployeeLicenseRow,
  EmployeeExtended,
  EmployeeRate,
  EmployeeContact,
  EmployeeLicense,
  EmployeeNote,
  EmployeePhoneRow,
  EmployeePayrollCompany,
} from "@/types/employee";
import type { FilterOption, PaginatedResult } from "@/types/search";
import { buildTextSearchIndex, searchTextIndex, type TextSearchIndex } from "@/lib/textSearchIndex";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function money(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

function toEmployeeSummary(row: EmployeeRow): EmployeeSummary {
  const firstName = safeStr(row.EmFirstName);
  const lastName = safeStr(row.EmLastName);
  return {
    employeeId: safeStr(row.EmployeeID),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || "Unknown",
    middleInitial: safeStr(row.EmMiddle),
    cellPhone: safeStr(row.EmMobilePhone),
    email: safeStr(row.EmEmail),
    trade: safeStr(row.TradeName),
    status: safeStr(row.StatusName),
    grade: safeStr(row.GradeName),
    city: safeStr(row.EmCity),
    state: safeStr(row.EmState),
    street: safeStr(row.EmStreet),
    userFlag5: "",
    s1: "",
    profileType: "Main",
    howReferred: "",
    qualification: "",
    averageInterview: "",
    fda: "",
    thw: "",
    licenseExpiration: "",
    weekEnding: "",
    payRate: "",
    payrollCompany: "",
    accessFields: {},
    currentAssignment: "",
  };
}

// ---------------------------------------------------------------------------
// SQL queries â€” column names confirmed from McLabor tblEmployee schema
// ---------------------------------------------------------------------------

const EMPLOYEE_LIST_SQL = `
SELECT
  e.EmployeeID,
  ISNULL(e.EmFirstName,         '')  AS EmFirstName,
  ISNULL(e.EmLastName,          '')  AS EmLastName,
  ISNULL(e.EmMiddle,            '')  AS EmMiddle,
  ISNULL(e.EmMobilePhone,       '')  AS EmMobilePhone,
  ISNULL(e.EmEmail,             '')  AS EmEmail,
  ISNULL(e.EmTradeID,           0)   AS EmTradeID,
  ISNULL(t.PullDownTrade,       '')  AS TradeName,
  ISNULL(e.EmEmployeeStatusID,  0)   AS EmEmployeeStatusID,
  ISNULL(s.PullDownEmployeeStatus, '') AS StatusName,
  ISNULL(e.EmGradeID,           0)   AS EmGradeID,
  ISNULL(g.PullDownGrade,       '')  AS GradeName,
  ISNULL(e.EmStreet,            '')  AS EmStreet,
  ISNULL(e.EmCity,              '')  AS EmCity,
  ISNULL(e.EmState,             '')  AS EmState,
  NULL AS EmZip
FROM  tblEmployee e WITH (NOLOCK)
LEFT  JOIN tblPullDownTrade           t WITH (NOLOCK) ON t.PullDownTradeID          = e.EmTradeID
LEFT  JOIN tblPullDownEmployeeStatus  s WITH (NOLOCK) ON s.PullDownEmployeeStatusID = e.EmEmployeeStatusID
LEFT  JOIN tblPullDownGrades          g WITH (NOLOCK) ON g.PullDownGradeID          = e.EmGradeID
ORDER BY e.EmLastName, e.EmFirstName
`;

const EMPLOYEE_INDEX_TTL_MS = 5 * 60 * 1000;
let employeeIndexCache: { expiresAt: number; rows: EmployeeRow[]; index: TextSearchIndex } | null = null;
let employeeIndexLoad: Promise<{ expiresAt: number; rows: EmployeeRow[]; index: TextSearchIndex }> | null = null;

async function loadEmployeeSearchIndex() {
  if (employeeIndexCache && employeeIndexCache.expiresAt > Date.now()) return employeeIndexCache;
  if (!employeeIndexLoad) {
    employeeIndexLoad = queryReadOnly<EmployeeRow>(EMPLOYEE_LIST_SQL).then((rows) => {
      const index = buildTextSearchIndex(rows.map((row) => [
        safeStr(row.EmFirstName), safeStr(row.EmLastName), safeStr(row.EmployeeID),
        safeStr(row.EmMobilePhone), safeStr(row.EmEmail), safeStr(row.EmCity),
      ]));
      const cached = { expiresAt: Date.now() + EMPLOYEE_INDEX_TTL_MS, rows, index };
      employeeIndexCache = cached;
      return cached;
    }).finally(() => { employeeIndexLoad = null; });
  }
  return employeeIndexLoad;
}

const EMPLOYEE_DETAIL_SQL = `
SELECT TOP (1)
  e.EmployeeID,
  ISNULL(e.EmFirstName,         '')  AS EmFirstName,
  ISNULL(e.EmLastName,          '')  AS EmLastName,
  ISNULL(e.EmMiddle,            '')  AS EmMiddle,
  ISNULL(e.EmHomePhone,         '')  AS EmHomePhone,
  ISNULL(e.EmMobilePhone,       '')  AS EmMobilePhone,
  ISNULL(e.EmEmail,             '')  AS EmEmail,
  ISNULL(e.EmTradeID,           0)   AS EmTradeID,
  ISNULL(t.PullDownTrade,       '')  AS TradeName,
  ISNULL(e.EmEmployeeStatusID,  0)   AS EmEmployeeStatusID,
  ISNULL(s.PullDownEmployeeStatus, '') AS StatusName,
  ISNULL(e.EmGradeID,           0)   AS EmGradeID,
  ISNULL(g.PullDownGrade,       '')  AS GradeName,
  ISNULL(e.EmStreet,            '')  AS EmStreet,
  ISNULL(e.EmCity,              '')  AS EmCity,
  ISNULL(e.EmState,             '')  AS EmState,
  ISNULL(e.EmZip,               '')  AS EmZip
FROM  tblEmployee e WITH (NOLOCK)
LEFT  JOIN tblPullDownTrade           t WITH (NOLOCK) ON t.PullDownTradeID          = e.EmTradeID
LEFT  JOIN tblPullDownEmployeeStatus  s WITH (NOLOCK) ON s.PullDownEmployeeStatusID = e.EmEmployeeStatusID
LEFT  JOIN tblPullDownGrades          g WITH (NOLOCK) ON g.PullDownGradeID          = e.EmGradeID
WHERE e.EmployeeID = @employeeId
`;

const EMPLOYEE_NOTES_SQL = `
SELECT
  ISNULL(EmployeeNoteUserName, '') AS EmployeeNoteUserName,
  CONVERT(VARCHAR(10), EmployeeNoteTimestamp, 101) AS EmployeeNoteDate,
  ISNULL(EmployeeNoteTypeID, 0) AS EmployeeNoteTypeID,
  ISNULL(EmployeeNoteReviewTypeID, 0) AS EmployeeNoteReviewTypeID,
  ISNULL(EmployeeNoteCustomerID, 0) AS EmployeeNoteCustomerID,
  CONVERT(VARCHAR(10), EmployeeNoteAssignmentDate, 101) AS EmployeeNoteAssignmentDate,
  ISNULL(EmployeeNote, '') AS EmployeeNote
FROM tblEmployeeNotes WITH (NOLOCK)
WHERE EmployeeID = @employeeId
ORDER BY EmployeeNoteTimestamp DESC
`;

const EMPLOYEE_PAYROLL_COMPANIES_SQL = `
SELECT
  ep.EmployeePayrollCoOnSiteID AS EmployeePayrollCoOnSiteID,
  ISNULL(pc.PullDownPayrollCoOnSiteInitials, pc.PullDownPayrollCoOnSiteName) AS PayrollCompany,
  ISNULL(ep.EmployeePayrollCoOnSiteDefault, 0) AS IsDefault,
  CONVERT(VARCHAR(10), ep.EmployeePayrollCoOnSiteJobApplicationDate, 101) AS JobApplicationDate,
  ISNULL(latest.JobApplicationStatusDesc, '') AS JobApplicationStatus,
  CONVERT(VARCHAR(10), COALESCE(ep.EmployeePayrollCoOnSiteMaxWeekEndingDate, latest.WeekEndingDate), 101) AS LastWeekAssigned,
  ISNULL(latest.CustomerBusName, '') AS Customer
FROM tblEmployeePayrollCoOnSite ep WITH (NOLOCK)
LEFT JOIN tblPullDownPayrollCoOnSite pc WITH (NOLOCK)
  ON pc.PullDownPayrollCoOnSiteID = ep.PayrollCoOnSiteID
OUTER APPLY (
  SELECT TOP (1) t.WeekEndingDate, t.CustomerBusName, t.JobApplicationStatusDesc
  FROM tblTracking t WITH (NOLOCK)
  WHERE t.EmployeeID = ep.EmployeeID AND t.PayrollCoOnSiteID = ep.PayrollCoOnSiteID
  ORDER BY t.WeekEndingDate DESC, t.AssignmentTimestamp DESC
) latest
WHERE ep.EmployeeID = @employeeId
ORDER BY ISNULL(ep.EmployeePayrollCoOnSiteDefault, 0) DESC, pc.PullDownPayrollCoOnSiteInitials
`;

const EMPLOYEE_B_SQL = `
SELECT TOP (1)
  ISNULL(BusinessName,    '') AS BusinessName,
  ISNULL(WillTravel,      '') AS WillTravel,
  ISNULL(DOTNumber,       '') AS DOTNumber,
  CONVERT(VARCHAR(10), DOTExpirationDate, 101) AS DOTExpirationDate,
  ISNULL(LicenseNumber,   '') AS LicenseNumber,
  CONVERT(VARCHAR(10), LicenseIssueDate, 101) AS LicenseIssueDate,
  ISNULL(PPEHardHat,            0) AS PPEHardHat,
  ISNULL(PPESteelToeBoots,      0) AS PPESteelToeBoots,
  ISNULL(PPESafetyGlasses,      0) AS PPESafetyGlasses,
  ISNULL(PPEGloves,             0) AS PPEGloves,
  ISNULL(PPEMasks,              0) AS PPEMasks,
  ISNULL(PPEHighVisibilityVest, 0) AS PPEHighVisibilityVest
FROM tblEmployeeB WITH (NOLOCK)
WHERE EmployeeID = @employeeId
`;

const EMPLOYEE_RATES_SQL = `
SELECT
  ISNULL(EmployeeRateID,    0)  AS EmployeeRateID,
  ISNULL(EmployeeRateField, '') AS EmployeeRateField,
  ISNULL(EmployeeRateOld,   0)  AS EmployeeRateOld,
  ISNULL(EmployeeRateNew,   0)  AS EmployeeRateNew,
  ISNULL(EmployeeRateNote,  '') AS EmployeeRateNote,
  ISNULL(EmployeeRateUserName, '') AS EmployeeRateUserName,
  CONVERT(VARCHAR(19), EmployeeRateTimestamp, 120) AS EmployeeRateTimestamp
FROM tblEmployeeRates WITH (NOLOCK)
WHERE EmployeeID = @employeeId
ORDER BY EmployeeRateTimestamp DESC
`;

const EMPLOYEE_CONTACTS_SQL = `
SELECT
  ISNULL(EmployeeContactID,           0)  AS EmployeeContactID,
  ISNULL(EmployeeContactFName,        '') AS EmployeeContactFName,
  ISNULL(EmployeeContactLName,        '') AS EmployeeContactLName,
  ISNULL(EmployeeContactRelationship, '') AS EmployeeContactRelationship,
  ISNULL(EmployeeContactPhone,        '') AS EmployeeContactPhone,
  ISNULL(EmployeeContactCell,         '') AS EmployeeContactCell,
  ISNULL(EmployeeContactEmail,        '') AS EmployeeContactEmail,
  ISNULL(EmployeeContactEmergency,    0)  AS EmployeeContactEmergency
FROM tblEmployeeContacts WITH (NOLOCK)
WHERE EmployeeID = @employeeId
ORDER BY EmployeeContactEmergency DESC, EmployeeContactLName
`;

const EMPLOYEE_LICENSES_SQL = `
SELECT
  ISNULL(l.EmployeeLicenseID,     0)  AS EmployeeLicenseID,
  ISNULL(l.EmployeeLicenseStateID, 0) AS EmployeeLicenseStateID,
  ISNULL(l.EmployeeLicenseTypeID,  0) AS EmployeeLicenseTypeID,
  ISNULL(l.EmployeeLicenseNumber, '') AS EmployeeLicenseNumber,
  CONVERT(VARCHAR(10), l.EmployeeLicenseExpDate, 101) AS EmployeeLicenseExpDate,
  ISNULL(l.EmployeeLicenseNotes,  '') AS EmployeeLicenseNotes
FROM tblEmployeeLicenses l WITH (NOLOCK)
WHERE l.EmployeeID = @employeeId
ORDER BY l.EmployeeLicenseExpDate DESC
`;

// ---------------------------------------------------------------------------
// Lookup maps (id -> label), each crash-safe
// ---------------------------------------------------------------------------

async function loadStateMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PullDownStateID: unknown; PullDownState: string | null }>(
      "SELECT PullDownStateID, ISNULL(PullDownState, '') AS PullDownState FROM tblPullDownStates WITH (NOLOCK)",
    );
    for (const r of rows) if (r.PullDownStateID != null) map.set(String(r.PullDownStateID), r.PullDownState ?? "");
  } catch { /* ignore */ }
  return map;
}

async function loadLicenseTypeMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await queryReadOnly<{ PullDownLicenseTypeID: unknown; PullDownLicenseType: string | null }>(
      "SELECT PullDownLicenseTypeID, ISNULL(PullDownLicenseType, '') AS PullDownLicenseType FROM tblPullDownLicenseTypes WITH (NOLOCK)",
    );
    for (const r of rows) if (r.PullDownLicenseTypeID != null) map.set(String(r.PullDownLicenseTypeID), r.PullDownLicenseType ?? "");
  } catch { /* ignore */ }
  return map;
}

async function loadEmployeeSearchHoldingFields(
  ids: string[],
): Promise<Map<string, Record<string, string>>> {
  const map = new Map<string, Record<string, string>>();
  const cleanIds = ids.filter((id) => /^\d+$/.test(id));
  if (cleanIds.length === 0) return map;
  try {
    const rows = await queryReadOnly<Record<string, unknown>>(
      `SELECT *
       FROM tblEmployeeSearch3Holding WITH (NOLOCK)
       WHERE EmployeeID IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))`,
      [{ name: "ids", value: cleanIds.join(",") }],
    );
    for (const row of rows) {
      if (row.EmployeeID == null) continue;
      const values: Record<string, string> = {};
      for (const [key, value] of Object.entries(row)) {
        values[key] =
          value instanceof Date ? value.toLocaleDateString("en-US") : safeStr(value);
      }
      map.set(String(row.EmployeeID), values);
    }
  } catch {
    // Some older database snapshots do not have the Access holding table.
  }
  return map;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toExtended(row: EmployeeBRow | undefined): EmployeeExtended {
  if (!row) {
    return { businessName: "", willTravel: "", dotNumber: "", dotExpiration: "", licenseNumber: "", licenseIssueDate: "", ppe: [] };
  }
  const ppe: string[] = [];
  if (bool(row.PPEHardHat)) ppe.push("Hard Hat");
  if (bool(row.PPESteelToeBoots)) ppe.push("Steel-Toe Boots");
  if (bool(row.PPESafetyGlasses)) ppe.push("Safety Glasses");
  if (bool(row.PPEGloves)) ppe.push("Gloves");
  if (bool(row.PPEMasks)) ppe.push("Masks");
  if (bool(row.PPEHighVisibilityVest)) ppe.push("Hi-Vis Vest");
  return {
    businessName: safeStr(row.BusinessName),
    willTravel: safeStr(row.WillTravel),
    dotNumber: safeStr(row.DOTNumber),
    dotExpiration: safeStr(row.DOTExpirationDate),
    licenseNumber: safeStr(row.LicenseNumber),
    licenseIssueDate: safeStr(row.LicenseIssueDate),
    ppe,
  };
}

function toRate(row: EmployeeRateRow): EmployeeRate {
  return {
    rateId: safeStr(row.EmployeeRateID),
    field: safeStr(row.EmployeeRateField) || "â€”",
    oldRate: money(row.EmployeeRateOld),
    newRate: money(row.EmployeeRateNew),
    note: safeStr(row.EmployeeRateNote),
    changedBy: safeStr(row.EmployeeRateUserName),
    changedOn: safeStr(row.EmployeeRateTimestamp),
  };
}

function toContact(row: EmployeeContactRow): EmployeeContact {
  const name = [safeStr(row.EmployeeContactFName), safeStr(row.EmployeeContactLName)].filter(Boolean).join(" ");
  return {
    contactId: safeStr(row.EmployeeContactID),
    fullName: name || "â€”",
    relationship: safeStr(row.EmployeeContactRelationship),
    phone: safeStr(row.EmployeeContactPhone),
    cell: safeStr(row.EmployeeContactCell),
    email: safeStr(row.EmployeeContactEmail),
    emergency: bool(row.EmployeeContactEmergency),
  };
}

function toLicense(
  row: EmployeeLicenseRow,
  stateMap: Map<string, string>,
  typeMap: Map<string, string>,
): EmployeeLicense {
  return {
    licenseId: safeStr(row.EmployeeLicenseID),
    state: stateMap.get(String(row.EmployeeLicenseStateID ?? "")) ?? "",
    type: typeMap.get(String(row.EmployeeLicenseTypeID ?? "")) ?? "",
    number: safeStr(row.EmployeeLicenseNumber),
    expDate: safeStr(row.EmployeeLicenseExpDate),
    notes: safeStr(row.EmployeeLicenseNotes),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetEmployeesParams {
  search?: string;
  tradeId?: string;
  statusId?: string;
  gradeId?: string;
  city?: string;
  state?: string;
}

export async function getEmployees(
  params: GetEmployeesParams = {},
): Promise<PaginatedResult<EmployeeSummary>> {
  const [{ rows, index }, defaultFields] = await Promise.all([
    loadEmployeeSearchIndex(), loadEmployeeDefaultFields(),
  ]);
  const filteredRows = searchTextIndex(index, params.search ?? "")
    .map((rowIndex) => rows[rowIndex])
    .filter((row) =>
      (!params.tradeId || String(row.EmTradeID ?? "") === params.tradeId)
      && (!params.statusId || String(row.EmEmployeeStatusID ?? "") === params.statusId)
      && (!params.gradeId || String(row.EmGradeID ?? "") === params.gradeId)
      && (!params.city || safeStr(row.EmCity) === params.city)
      && (!params.state || safeStr(row.EmState) === params.state));
  const total = filteredRows.length;
  const data = filteredRows.map(toEmployeeSummary);
  for (const e of data) {
    const fields = defaultFields.get(e.employeeId) ?? {};
    e.accessFields = fields;
    e.userFlag5 = fields.EmployeeUserFlag5 ?? "";
    e.s1 = fields.S1 ?? "";
    e.profileType = fields.EmployeeProfileType ?? "";
    e.howReferred = fields.EmHowReferred ?? "";
    e.qualification = fields.EmQualification ?? "";
    e.averageInterview = fields.AvgHrsWorked ?? "";
    e.fda = fields.FirstDateOnJob ?? "";
    e.thw = fields.TotalHoursWorked ?? "";
    e.licenseExpiration = fields.LicenseExpDateFlag ?? "";
    e.currentAssignment = [fields.CustomerBusName, fields.SiteName].filter(Boolean).join(" · ");
    e.weekEnding = fields.WeekEndingDate ?? "";
    e.payRate = fields.PayRate ?? "";
    e.payrollCompany = fields.PayrollCoOnSiteInitials ?? "";
  }

  return { data, total, page: 1, pageSize: data.length, hasMore: false };
}

export async function getEmployeeQuickSearchOptions(): Promise<Array<Pick<EmployeeSummary, "employeeId" | "fullName">>> {
  const rows = await queryReadOnly<{ EmployeeID: unknown; EmFirstName: string | null; EmLastName: string | null }>(
    `SELECT TOP (1000) EmployeeID, EmFirstName, EmLastName
     FROM tblEmployee WITH (NOLOCK)
     ORDER BY EmLastName, EmFirstName, EmployeeID`,
  );
  return rows.map(row => {
    const first = safeStr(row.EmFirstName);
    const last = safeStr(row.EmLastName);
    return { employeeId: safeStr(row.EmployeeID), fullName: [first, last].filter(Boolean).join(" ") || "Unknown" };
  });
}

export async function getEmployeeById(
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const [rows, bRows, rateRows, contactRows, licenseRows, stateMap, licenseTypeMap, holdingMap, noteRows, payrollRows] =
    await Promise.all([
      queryReadOnly<EmployeeRow>(EMPLOYEE_DETAIL_SQL, [{ name: "employeeId", value: employeeId }]),
      queryReadOnly<EmployeeBRow>(EMPLOYEE_B_SQL, [{ name: "employeeId", value: employeeId }]).catch(
        () => [] as EmployeeBRow[],
      ),
      queryReadOnly<EmployeeRateRow>(EMPLOYEE_RATES_SQL, [{ name: "employeeId", value: employeeId }]).catch(
        () => [] as EmployeeRateRow[],
      ),
      queryReadOnly<EmployeeContactRow>(EMPLOYEE_CONTACTS_SQL, [{ name: "employeeId", value: employeeId }]).catch(
        () => [] as EmployeeContactRow[],
      ),
      queryReadOnly<EmployeeLicenseRow>(EMPLOYEE_LICENSES_SQL, [{ name: "employeeId", value: employeeId }]).catch(
        () => [] as EmployeeLicenseRow[],
      ),
      loadStateMap(),
      loadLicenseTypeMap(),
      loadEmployeeSearchHoldingFields([employeeId]),
      queryReadOnly<Record<string, unknown>>(EMPLOYEE_NOTES_SQL, [{ name: "employeeId", value: employeeId }]).catch(() => []),
      queryReadOnly<Record<string, unknown>>(EMPLOYEE_PAYROLL_COMPANIES_SQL, [{ name: "employeeId", value: employeeId }]).catch(() => []),
    ]);

  const row = rows[0];
  if (!row) return null;

  const summary = toEmployeeSummary(row);
  const accessFields = holdingMap.get(employeeId) ?? {};
  const phoneValue = (key: string, fallback = "") => accessFields[key] || fallback;
  const phoneRows: EmployeePhoneRow[] = [1, 2, 3, 4].map((n) => ({
    number: phoneValue(n === 1 ? "EmMobilePhone" : `EmMobilePhone${n}`, n === 1 ? summary.cellPhone : ""),
    textAddress: phoneValue(n === 1 ? "TextMsgAddress" : `TextMsgAddress${n}`, n === 1 ? summary.email : ""),
    noCommunication: bool(accessFields[n === 1 ? "EmployeeNoCommunicationText" : `EmployeeNoComm${n}Text`]),
    valid: bool(accessFields[n === 1 ? "EmMobilePhoneVerifyText" : `EmMobilePhone${n}VerifyText`]),
    verifyPrimary: bool(accessFields[n === 1 ? "VerifyPrimaryMobilePhone" : `VerifyPrimaryMobilePhone${n}`]),
    user: phoneValue(n === 1 ? "EmployeeNoCommUserName" : `EmployeeNoCommUserName${n}`),
    date: phoneValue(n === 1 ? "EmployeeNoCommDate" : `EmployeeNoCommDate${n}`),
  }));
  const notes: EmployeeNote[] = noteRows.map((note) => ({
    user: safeStr(note.EmployeeNoteUserName),
    date: safeStr(note.EmployeeNoteDate),
    noteType: safeStr(note.EmployeeNoteTypeID),
    reviewType: safeStr(note.EmployeeNoteReviewTypeID),
    customer: safeStr(note.EmployeeNoteCustomerID),
    assignmentDate: safeStr(note.EmployeeNoteAssignmentDate),
    note: safeStr(note.EmployeeNote),
  }));
  const payrollCompanies: EmployeePayrollCompany[] = payrollRows.map((company) => ({
    id: safeStr(company.EmployeePayrollCoOnSiteID),
    name: safeStr(company.PayrollCompany),
    isDefault: bool(company.IsDefault),
    jobApplicationDate: safeStr(company.JobApplicationDate),
    jobApplicationStatus: safeStr(company.JobApplicationStatus),
    lastWeekAssigned: safeStr(company.LastWeekAssigned),
    customer: safeStr(company.Customer),
  }));
  return {
    ...summary,
    middleInitial: safeStr(row.EmMiddle),
    accessFields,
    homePhone: phoneValue("EmHomePhone", safeStr(row.EmHomePhone)),
    phoneRows,
    notes,
    payrollCompanies,
    address: safeStr(row.EmStreet),
    city: safeStr(row.EmCity),
    state: safeStr(row.EmState),
    zip: safeStr(row.EmZip),
    extended: toExtended(bRows[0]),
    rates: rateRows.map(toRate),
    contacts: contactRows.map(toContact),
    licenses: licenseRows.map((l) => toLicense(l, stateMap, licenseTypeMap)),
    recentAssignments: [],
  };
}

export async function getEmployeeFilterOptions(): Promise<{
  trades: FilterOption[];
  qualifications: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
}> {
  const [tradeRows, qualificationRows, statusRows, gradeRows, cityRows, stateRows] = await Promise.all([
    queryReadOnly<{ PullDownTradeID: unknown; PullDownTrade: string | null }>(
      "SELECT PullDownTradeID, ISNULL(PullDownTrade, '') AS PullDownTrade FROM tblPullDownTrade WITH (NOLOCK) ORDER BY PullDownTrade",
    ).catch(() => []),
    queryReadOnly<{ PullDownQualificationID: unknown; PullDownQualification: string | null }>(
      "SELECT PullDownQualificationID, ISNULL(PullDownQualification, '') AS PullDownQualification FROM tblPullDownQualifications WITH (NOLOCK) ORDER BY PullDownQualification",
    ).catch(() => []),
    queryReadOnly<{ PullDownEmployeeStatusID: unknown; PullDownEmployeeStatus: string | null }>(
      "SELECT PullDownEmployeeStatusID, ISNULL(PullDownEmployeeStatus, '') AS PullDownEmployeeStatus FROM tblPullDownEmployeeStatus WITH (NOLOCK) ORDER BY PullDownEmployeeStatus",
    ).catch(() => []),
    queryReadOnly<{ PullDownGradeID: unknown; PullDownGrade: string | null }>(
      "SELECT PullDownGradeID, ISNULL(PullDownGrade, '') AS PullDownGrade FROM tblPullDownGrades WITH (NOLOCK) ORDER BY PullDownGrade",
    ).catch(() => []),
    queryReadOnly<{ EmCity: string | null }>(
      "SELECT DISTINCT EmCity FROM tblEmployee WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(EmCity, '')))) > 1 ORDER BY EmCity",
    ).catch(() => []),
    queryReadOnly<{ EmState: string | null }>(
      "SELECT DISTINCT EmState FROM tblEmployee WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(EmState, '')))) > 0 ORDER BY EmState",
    ).catch(() => []),
  ]);

  return {
    trades: tradeRows.map((r) => ({
      value: String(r.PullDownTradeID ?? ""),
      label: r.PullDownTrade ?? "",
    })),
    qualifications: qualificationRows.map((r) => ({ value: String(r.PullDownQualificationID ?? ""), label: r.PullDownQualification ?? "" })),
    statuses: statusRows.map((r) => ({
      value: String(r.PullDownEmployeeStatusID ?? ""),
      label: r.PullDownEmployeeStatus ?? "",
    })),
    grades: gradeRows.map((r) => ({
      value: String(r.PullDownGradeID ?? ""),
      label: r.PullDownGrade ?? "",
    })),
    cities: toUniqueOptions(cityRows.map((r) => safeStr(r.EmCity))),
    states: toUniqueOptions(stateRows.map((r) => safeStr(r.EmState))),
  };
}

export async function getEmployeeLicenseDropdownOptions(): Promise<Record<string, string[]>> {
  const keys = ["CTLevel", "LicenseStatus", "LicenseObtainedByMethod", "LicenseExpDateFlag", "Covid19VaccinationStatus", "SubTrade1", "SubTrade2", "SubTrade3", "SubTrade4"] as const;
  const entries = await Promise.all(keys.map(async (key) => {
    const rows = await queryReadOnly<{ value: unknown }>(
      `SELECT DISTINCT LTRIM(RTRIM(CONVERT(NVARCHAR(255), ${key}))) AS value FROM tblEmployeeSearch3Holding WITH (NOLOCK) WHERE LEN(LTRIM(RTRIM(ISNULL(CONVERT(NVARCHAR(255), ${key}), '')))) > 0 ORDER BY value`,
    ).catch(() => []);
    return [key, rows.map((row) => safeStr(row.value)).filter(Boolean)] as const;
  }));
  return Object.fromEntries(entries);
}

export async function getEmployeeHealthInsuranceDropdownOptions(): Promise<{ insurance: FilterOption[]; flags: FilterOption[] }> {
  const [insuranceRows, flagRows] = await Promise.all([
    queryReadOnly<{ value: unknown; label: string | null }>("SELECT CAST(PullDownHealthInsuranceID AS NVARCHAR(20)) AS value, ISNULL(PullDownHealthInsuranceDesc,'') AS label FROM tblPullDownHealthInsurance WITH (NOLOCK) ORDER BY PullDownHealthInsuranceDesc").catch(() => []),
    queryReadOnly<{ value: unknown; label: string | null }>("SELECT CAST(PullDownHealthInsuranceFlagID AS NVARCHAR(20)) AS value, ISNULL(PullDownHealthInsuranceFlag,'') AS label FROM tblPullDownHealthInsuranceFlags WITH (NOLOCK) ORDER BY PullDownHealthInsuranceFlag").catch(() => []),
  ]);
  return { insurance: insuranceRows.map(row => ({ value: String(row.value ?? ""), label: row.label ?? "" })).filter(row => row.label), flags: flagRows.map(row => ({ value: String(row.value ?? ""), label: row.label ?? "" })).filter(row => row.label) };
}

export async function getEmployeeReferralAgencyOptions(): Promise<string[]> {
  const rows = await queryReadOnly<{ ReferralAgencyName: string | null }>(
    `SELECT ISNULL(PullDownReferralAgencyName, '') AS ReferralAgencyName
     FROM tblPullDownReferralAgency WITH (NOLOCK)
     ORDER BY PullDownReferralAgencyName`,
  ).catch(() => []);
  return toUniqueOptions(rows.map(row => safeStr(row.ReferralAgencyName))).map(option => option.label);
}

/**
 * De-duplicate raw string values into FilterOptions. SQL DISTINCT can still
 * produce duplicates once trimmed (e.g. "Salem" vs "Salem "), which breaks
 * React keys â€” so dedupe case-insensitively here.
 */
function toUniqueOptions(values: string[]): FilterOption[] {
  const seen = new Set<string>();
  const options: FilterOption[] = [];
  for (const value of values) {
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ value, label: value });
  }
  return options;
}
