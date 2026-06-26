export type TrackingTabId =
  | "tracking"
  | "hours"
  | "hours2"
  | "benefits"
  | "ts-history";

export interface WeekContext {
  /** Friday week-ending date (Access ThisWeekDayDate with day 7) */
  weekEndingDate: string;
  assignWeek: number;
  assignYear: number;
  /** Saturday start of work week */
  weekStartDate: string;
  displayDate: string;
}

export interface AssignedContextPlaceholder {
  customerLabel: string;
  jobLabel: string;
}

/**
 * A single read-only assignment/tracking row for the main grid.
 * Columns map directly to confirmed `tblTracking` columns (see
 * docs/FULL_FIELD_MAPPING.md). All values are pre-formatted strings.
 */
export interface TrackingPreviewRow {
  employeeId: string;
  firstName: string;
  lastName: string;
  city: string;
  cell: string;
  grade: string;
  wcc: string;
  customer: string;
  jobSite: string;
  satHours: string;
  sunHours: string;
  monHours: string;
  tueHours: string;
  wedHours: string;
  thuHours: string;
  friHours: string;
  totalHours: string;
  payRate: string;
  billRate: string;
  billRateOT: string;
  weekEnding: string;
  /** Access "Placeholder" flag — a held slot with no employee assigned yet. */
  placeholder: boolean;
}

export interface TrackingPreview {
  rows: TrackingPreviewRow[];
  /** Which SQL source produced the rows, or null if none was reachable. */
  source: string | null;
  /** True when rows are from a fallback (not the requested week). */
  fallback?: boolean;
}
