/** Job Search Views 3 — left button grid (2×8). */
export type JobViews3BtnStyle = "yellow" | "new-apps" | "orange";

export type JobViews3Button = {
  label: string;
  style?: JobViews3BtnStyle;
};

export const JOB_VIEWS_3_BUTTON_GRID: readonly (readonly (JobViews3Button | null)[])[] = [
  [{ label: "Open Jobs", style: "new-apps" }, { label: "Active", style: "yellow" }],
  [{ label: "Closed", style: "yellow" }, { label: "This Week", style: "yellow" }],
  [{ label: "Last Week", style: "yellow" }, { label: "Assignments", style: "yellow" }],
  [{ label: "No Assign", style: "yellow" }, { label: "Foreman", style: "yellow" }],
  [{ label: "Site Data", style: "orange" }, null],
  [null, null],
  [null, null],
  [null, null],
] as const;

export const JOB_VIEWS_TIME_FRAME = [
  "All",
  "Today",
  "Yesterday",
  "This Week",
  "Last Week",
  "This Month",
  "Last Month",
  "Year-to-Date",
  "Last Year",
] as const;

export const JOB_VIEWS_TRADE_OPTIONS = [
  "All",
  "Electrician",
  "Plumber",
  "HVAC",
  "Carpenter",
  "Operator",
  "Laborer",
] as const;

export const JOB_VIEWS_STATE_OPTIONS = [
  "All",
  "MA",
  "NH",
  "ME",
  "VT",
  "RI",
  "CT",
  "NY",
] as const;

export const JOB_VIEWS_COUNTY_OPTIONS = [
  "All",
  "Suffolk",
  "Norfolk",
  "Middlesex 1",
  "Middlesex 2",
  "Plymouth",
  "Bristol",
  "Essex",
  "Worcester",
  "Franklin",
  "Hampshire",
  "Hampden",
  "Berkshire",
] as const;

export const JOB_VIEWS_4_PROFILE = [
  "All",
  "[ Job Search -",
  "Has Assign",
  "No Assign ]",
] as const;

export const JOB_VIEWS_4_TIME_FOR = [
  "Start Date",
  "End Date",
  "Last Assignment",
  "Entry Date",
  "Week Ending",
] as const;

export const JOB_VIEWS_4_TIME_DURATION = [
  "All",
  "Current Wk",
  "Last Wk",
  ">1 - 4 Wks",
  ">4 - 8 Wks",
  ">8 - 12 Wks",
  ">12 - 24 Wks",
  ">24 - 36 Wks",
  ">36 - 52 Wks",
  ">1 - 2 Yrs",
  ">2 - 3 Yrs",
  ">3 - 4 Yrs",
  ">4 - 5 Yrs",
  ">5 Yrs",
] as const;

export const JOB_VIEWS_4_TRADE = JOB_VIEWS_TRADE_OPTIONS;

export const JOB_VIEWS_4_STATUS = [
  "All",
  "Open",
  "Closed",
  "Pending",
  "On Hold",
  "Active",
] as const;

export const JOB_MA_COPY_ROWS = [
  { label: "Customer + Job Name", google: true },
  { label: "City + State", google: false },
  {
    label: "Customer + Job + City + State",
    google: false,
    extraButtons: ["Map", "Directions", "GC Info"],
  },
  { label: "Customer + Job + Foreman", google: true },
] as const;

export const JOB_NH_TRADE_BUTTONS = [
  "Commercial",
  "Residential",
  "Industrial",
  "Service",
] as const;

export const JOB_ADMIN_INCLUDE_PROFILES = [
  "Include [Main] Job Search",
  "Include [Sub Div 1] Active",
  "Include [Sub Div 2] Closed",
  "Include [Sub Div 3] Hold",
  "Include Profile 5",
  "Include Profile 6",
  "Include Profile 7",
  "Include Profile 8",
  "Include Profile 9",
  "Include Profile 10",
] as const;

export const JOB_CALL_LISTS_TRADE = JOB_VIEWS_4_TRADE;

export const JOB_CALL_LISTS_LIST = ["None", "1", "2", "3"] as const;

export const JOB_SCHEDULE_DATE_OPTIONS = [
  "All",
  "This Week",
  "Last Week",
  "Next Week",
  "This Month",
  "Last Month",
] as const;

export const JOB_CALL_LISTS_2_ADDITIONAL = [
  "1. Open jobs with assignments.",
  "2. Open jobs with no assignments.",
  "3. Jobs ending this week.",
  "4. Jobs starting this week.",
  "5. All Others.",
] as const;

export function jobViews3BtnClass(style?: JobViews3BtnStyle): string | undefined {
  switch (style) {
    case "yellow":
      return "ac-employee-views3-btn-yellow";
    case "new-apps":
      return "ac-employee-views3-btn-new-apps";
    case "orange":
      return "ac-employee-views3-btn-orange";
    default:
      return undefined;
  }
}
