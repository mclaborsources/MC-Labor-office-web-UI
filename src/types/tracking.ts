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
