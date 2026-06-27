import { queryReadOnly } from "@/lib/db/sql";
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
} from "@/types/employee";
import type { FilterOption, PaginatedResult } from "@/types/search";

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
    currentAssignment: "",
  };
}

// ---------------------------------------------------------------------------
// SQL queries — column names confirmed from McLabor tblEmployee schema
// ---------------------------------------------------------------------------

const EMPLOYEE_LIST_SQL = `
SELECT TOP (200)
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
WHERE
  (@searchPat IS NULL
    OR e.EmLastName      LIKE @searchPat
    OR e.EmFirstName     LIKE @searchPat
    OR CAST(e.EmployeeID AS NVARCHAR(20)) LIKE @searchPat
    OR e.EmMobilePhone   LIKE @searchPat
    OR e.EmEmail         LIKE @searchPat
    OR e.EmCity          LIKE @searchPat)
  AND (@tradeId  IS NULL OR CAST(e.EmTradeID          AS NVARCHAR(20)) = @tradeId)
  AND (@statusId IS NULL OR CAST(e.EmEmployeeStatusID AS NVARCHAR(20)) = @statusId)
  AND (@gradeId  IS NULL OR CAST(e.EmGradeID          AS NVARCHAR(20)) = @gradeId)
  AND (@city  IS NULL OR e.EmCity  = @city)
  AND (@state IS NULL OR e.EmState = @state)
ORDER BY e.EmLastName, e.EmFirstName
`;

const EMPLOYEE_DETAIL_SQL = `
SELECT TOP (1)
  e.EmployeeID,
  ISNULL(e.EmFirstName,         '')  AS EmFirstName,
  ISNULL(e.EmLastName,          '')  AS EmLastName,
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

// Latest assignment per employee, bounded to the displayed employee IDs.
const CURRENT_ASSIGNMENT_SQL = `
WITH ranked AS (
  SELECT
    EmployeeID,
    ISNULL(CustomerBusName, '') AS CustomerBusName,
    ISNULL(SiteName, '')        AS SiteName,
    ROW_NUMBER() OVER (PARTITION BY EmployeeID ORDER BY AssignmentTimestamp DESC) AS rn
  FROM tblTracking WITH (NOLOCK)
  WHERE EmployeeID IN (SELECT CAST(value AS INT) FROM STRING_SPLIT(@ids, ','))
)
SELECT EmployeeID, CustomerBusName, SiteName FROM ranked WHERE rn = 1
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

async function loadCurrentAssignments(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const cleanIds = ids.filter((id) => /^\d+$/.test(id));
  if (cleanIds.length === 0) return map;
  try {
    const rows = await queryReadOnly<{ EmployeeID: unknown; CustomerBusName: string | null; SiteName: string | null }>(
      CURRENT_ASSIGNMENT_SQL,
      [{ name: "ids", value: cleanIds.join(",") }],
    );
    for (const r of rows) {
      if (r.EmployeeID == null) continue;
      const parts = [safeStr(r.CustomerBusName), safeStr(r.SiteName)].filter(Boolean);
      map.set(String(r.EmployeeID), parts.join(" · "));
    }
  } catch { /* ignore */ }
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
    field: safeStr(row.EmployeeRateField) || "—",
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
    fullName: name || "—",
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
  const searchPat = params.search ? `%${params.search}%` : null;
  const tradeId = params.tradeId || null;
  const statusId = params.statusId || null;
  const gradeId = params.gradeId || null;
  const city = params.city || null;
  const state = params.state || null;

  const rows = await queryReadOnly<EmployeeRow>(EMPLOYEE_LIST_SQL, [
    { name: "searchPat", value: searchPat },
    { name: "tradeId", value: tradeId },
    { name: "statusId", value: statusId },
    { name: "gradeId", value: gradeId },
    { name: "city", value: city },
    { name: "state", value: state },
  ]);

  const data = rows.map(toEmployeeSummary);
  const assignmentMap = await loadCurrentAssignments(data.map((e) => e.employeeId));
  for (const e of data) {
    e.currentAssignment = assignmentMap.get(e.employeeId) ?? "";
  }

  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getEmployeeById(
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const [rows, bRows, rateRows, contactRows, licenseRows, stateMap, licenseTypeMap] =
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
    ]);

  const row = rows[0];
  if (!row) return null;

  const summary = toEmployeeSummary(row);
  return {
    ...summary,
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
  statuses: FilterOption[];
  grades: FilterOption[];
  cities: FilterOption[];
  states: FilterOption[];
}> {
  const [tradeRows, statusRows, gradeRows, cityRows, stateRows] = await Promise.all([
    queryReadOnly<{ PullDownTradeID: unknown; PullDownTrade: string | null }>(
      "SELECT PullDownTradeID, ISNULL(PullDownTrade, '') AS PullDownTrade FROM tblPullDownTrade WITH (NOLOCK) ORDER BY PullDownTrade",
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

/**
 * De-duplicate raw string values into FilterOptions. SQL DISTINCT can still
 * produce duplicates once trimmed (e.g. "Salem" vs "Salem "), which breaks
 * React keys — so dedupe case-insensitively here.
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
