import { queryReadOnly } from "@/lib/db/sql";
import type { EmployeeSummary, EmployeeDetail, EmployeeRow } from "@/types/employee";
import type { FilterOption, PaginatedResult } from "@/types/search";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toEmployeeSummary(row: EmployeeRow): EmployeeSummary {
  const firstName = safeStr(row.EmFirstName);
  const lastName = safeStr(row.EmLastName);
  return {
    employeeId: safeStr(row.EmployeeID),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" ") || "Unknown",
    cellPhone: safeStr(row.EmMobilePhone),
    email: safeStr(row.EmEmail),
    trade: safeStr(row.TradeName),
    status: safeStr(row.StatusName),
    grade: safeStr(row.GradeName),
  };
}

// ---------------------------------------------------------------------------
// SQL queries — column names confirmed from McLabor tblEmployee schema
//
// tblEmployee:          EmployeeID, EmFirstName, EmLastName, EmMobilePhone,
//                       EmEmail, EmTradeID, EmEmployeeStatusID, EmGradeID,
//                       EmStreet, EmCity, EmState, EmZip
// tblPullDownTrade:     PullDownTradeID, PullDownTrade
// tblPullDownEmployeeStatus: PullDownEmployeeStatusID, PullDownEmployeeStatus
// tblPullDownGrades:    PullDownGradeID, PullDownGrade
// ---------------------------------------------------------------------------

const EMPLOYEE_LIST_SQL = `
SELECT TOP (200)
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
  NULL AS EmStreet,
  NULL AS EmCity,
  NULL AS EmState,
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
    OR e.EmEmail         LIKE @searchPat)
  AND (@tradeId  IS NULL OR CAST(e.EmTradeID          AS NVARCHAR(20)) = @tradeId)
  AND (@statusId IS NULL OR CAST(e.EmEmployeeStatusID AS NVARCHAR(20)) = @statusId)
  AND (@gradeId  IS NULL OR CAST(e.EmGradeID          AS NVARCHAR(20)) = @gradeId)
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetEmployeesParams {
  search?: string;
  tradeId?: string;
  statusId?: string;
  gradeId?: string;
}

export async function getEmployees(
  params: GetEmployeesParams = {},
): Promise<PaginatedResult<EmployeeSummary>> {
  const searchPat = params.search ? `%${params.search}%` : null;
  const tradeId = params.tradeId || null;
  const statusId = params.statusId || null;
  const gradeId = params.gradeId || null;

  const rows = await queryReadOnly<EmployeeRow>(EMPLOYEE_LIST_SQL, [
    { name: "searchPat", value: searchPat },
    { name: "tradeId", value: tradeId },
    { name: "statusId", value: statusId },
    { name: "gradeId", value: gradeId },
  ]);

  const data = rows.map(toEmployeeSummary);
  return { data, total: data.length, page: 1, pageSize: 200, hasMore: false };
}

export async function getEmployeeById(
  employeeId: string,
): Promise<EmployeeDetail | null> {
  const rows = await queryReadOnly<EmployeeRow>(EMPLOYEE_DETAIL_SQL, [
    { name: "employeeId", value: employeeId },
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
    recentAssignments: [], // Expanded in Milestone 4
  };
}

export async function getEmployeeFilterOptions(): Promise<{
  trades: FilterOption[];
  statuses: FilterOption[];
  grades: FilterOption[];
}> {
  const [tradeRows, statusRows, gradeRows] = await Promise.all([
    queryReadOnly<{ PullDownTradeID: unknown; PullDownTrade: string | null }>(
      "SELECT PullDownTradeID, ISNULL(PullDownTrade, '') AS PullDownTrade FROM tblPullDownTrade WITH (NOLOCK) ORDER BY PullDownTrade",
    ).catch(() => []),
    queryReadOnly<{ PullDownEmployeeStatusID: unknown; PullDownEmployeeStatus: string | null }>(
      "SELECT PullDownEmployeeStatusID, ISNULL(PullDownEmployeeStatus, '') AS PullDownEmployeeStatus FROM tblPullDownEmployeeStatus WITH (NOLOCK) ORDER BY PullDownEmployeeStatus",
    ).catch(() => []),
    queryReadOnly<{ PullDownGradeID: unknown; PullDownGrade: string | null }>(
      "SELECT PullDownGradeID, ISNULL(PullDownGrade, '') AS PullDownGrade FROM tblPullDownGrades WITH (NOLOCK) ORDER BY PullDownGrade",
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
  };
}
