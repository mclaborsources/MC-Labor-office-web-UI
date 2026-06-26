import { queryReadOnly } from "@/lib/db/sql";
import type { TrackingPreview, TrackingPreviewRow } from "@/types/tracking";

// ---------------------------------------------------------------------------
// Tracking preview — read-only assignment rows for the main tracking grid.
//
// Columns are now mapped to the CONFIRMED tblTracking schema (290-table SQL
// metadata extract; see docs/FULL_FIELD_MAPPING.md). tblTracking denormalizes
// the employee name/city/cell/grade, so no joins are required for the grid.
//
// This stays strictly read-only. If the typed query fails for any reason we
// fall back to a crash-safe SELECT * probe so the screen never breaks.
// ---------------------------------------------------------------------------

interface GetTrackingPreviewArgs {
  week?: number;
  year?: number;
  limit?: number;
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

interface TrackingRow {
  EmployeeID: number | null;
  EmFirstName: string | null;
  EmLastName: string | null;
  EmCity: string | null;
  EmMobilePhone: string | null;
  Grade: string | null;
  WCC: string | null;
  CustomerBusName: string | null;
  SiteName: string | null;
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
  WeekEndingDate: string | Date | null;
  Placeholder: boolean | null;
}

const SELECT_COLUMNS = `
  TrackingID, EmployeeID, EmFirstName, EmLastName, EmCity, EmMobilePhone, Grade, WCC,
  CustomerBusName, SiteName,
  SatHours, SunHours, MonHours, TueHours, WedHours, ThuHours, FriHours, TotalHours,
  PayRate, BillRate, BillRateOT, WeekEndingDate, Placeholder`;

function mapRow(r: TrackingRow): TrackingPreviewRow {
  const we = r.WeekEndingDate
    ? new Date(r.WeekEndingDate).toLocaleDateString("en-US")
    : "";
  return {
    employeeId: str(r.EmployeeID),
    firstName: str(r.EmFirstName),
    lastName: str(r.EmLastName),
    city: str(r.EmCity),
    cell: str(r.EmMobilePhone),
    grade: str(r.Grade),
    wcc: str(r.WCC),
    customer: str(r.CustomerBusName),
    jobSite: str(r.SiteName),
    satHours: hours(r.SatHours),
    sunHours: hours(r.SunHours),
    monHours: hours(r.MonHours),
    tueHours: hours(r.TueHours),
    wedHours: hours(r.WedHours),
    thuHours: hours(r.ThuHours),
    friHours: hours(r.FriHours),
    totalHours: hours(r.TotalHours),
    payRate: money(r.PayRate),
    billRate: money(r.BillRate),
    billRateOT: money(r.BillRateOT),
    weekEnding: we,
    placeholder: r.Placeholder === true,
  };
}

export async function getTrackingPreview(
  args: GetTrackingPreviewArgs = {},
): Promise<TrackingPreview> {
  const top = Math.max(1, Math.min(500, Math.floor(args.limit ?? 300)));
  const hasWeek = typeof args.week === "number" && typeof args.year === "number";

  try {
    // 1) Try the requested week first.
    if (hasWeek) {
      const rows = await queryReadOnly<TrackingRow>(
        `SELECT TOP (${top}) ${SELECT_COLUMNS}
         FROM tblTracking WITH (NOLOCK)
         WHERE AssignWeek = @week AND AssignYear = @year
         ORDER BY Placeholder ASC, EmLastName ASC, EmFirstName ASC`,
        [
          { name: "week", value: args.week },
          { name: "year", value: args.year },
        ],
      );
      if (rows.length > 0) {
        return { rows: rows.map(mapRow), source: "tblTracking" };
      }
    }

    // 2) Fall back to the most recent assignments so the grid isn't empty.
    const recent = await queryReadOnly<TrackingRow>(
      `SELECT TOP (${top}) ${SELECT_COLUMNS}
       FROM tblTracking WITH (NOLOCK)
       ORDER BY AssignmentTimestamp DESC`,
    );
    return { rows: recent.map(mapRow), source: "tblTracking", fallback: hasWeek };
  } catch {
    // 3) Crash-safe fallback: source unreachable / schema mismatch.
    return { rows: [], source: null };
  }
}
