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
 * Columns map to `tblTracking` (Access frmTrackingEditHolding datasheet).
 */
export interface TrackingPreviewRow {
  employeeId: string;
  payrollCo: string;
  payrollCoColor: string;
  jobSite: string;
  infoSent: string;
  semus: string;
  jobApp: string;
  osha: string;
  health: string;
  firstName: string;
  middleInitial: string;
  lastName: string;
  city: string;
  cell: string;
  gradeChange: string;
  wccState: string;
  wcc: string;
  perDiem: string;
  oh: string;
  directionsEmail: string;
  directionsText: string;
  dirVerified: string;
  trackMargin: string;
  satHours: string;
  sunHours: string;
  monHours: string;
  tueHours: string;
  wedHours: string;
  thuHours: string;
  friHours: string;
  payRate: string;
  billRate: string;
  billRateOT: string;
  hoursNote: string;
  assignmentUser: string;
  assignmentTimestamp: string;
  hlCv: string;
  hlCvColor: string;
  sendAutoText: string;
  hrsAutoTextUser: string;
  hrsAutoTextTimestamp: string;
  hlAutoTextUser: string;
  hlAutoTextTimestamp: string;
  parkingPerHr: string;
  customer: string;
  totalHours: string;
  weekEnding: string;
  placeholder: boolean;
  dayFlags: string[];
}

export interface TrackingCustomerOption {
  customerId: string;
  label: string;
  rowCount: number;
}

export interface TrackingJobOption {
  projectId: string;
  label: string;
}

export interface TrackingJobContact {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  cell: string;
  officePhone: string;
  notes: string;
  sort: string;
}

export interface TrackingSalesmanOption {
  id: string;
  name: string;
}

export interface TrackingReferralAgency {
  id: string;
  name: string;
}

export interface TrackingJobInfo {
  customerName: string;
  contractWith: string;
  contractDate: string;
  salesman: string;
  creditHistory: string;
  oldestInvoice: string;
  totalOwed: string;
  w9OnFile: string;
  wcDate: string;
  glDate: string;
  tia: string;
  cpm: string;
  estimatedInvoice: string;
  billRates: { grade: string; rate: string }[];
  marginRows: { total: string; margin: string }[];
  contacts: TrackingJobContact[];
  salesmen: TrackingSalesmanOption[];
  referralAgencies: TrackingReferralAgency[];
}

export interface TrackingPreview {
  rows: TrackingPreviewRow[];
  source: string | null;
  fallback?: boolean;
}
