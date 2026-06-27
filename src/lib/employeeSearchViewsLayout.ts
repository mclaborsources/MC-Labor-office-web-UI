/** Employee Search Views 3 — left button grid (2×8). */
export type EmployeeViews3BtnStyle = "yellow" | "new-apps" | "orange";

export type EmployeeViews3Button = {
  label: string;
  style?: EmployeeViews3BtnStyle;
};

export const EMPLOYEE_VIEWS_3_BUTTON_GRID: readonly (readonly (EmployeeViews3Button | null)[])[] = [
  [{ label: "New Apps", style: "new-apps" }, { label: "Remote", style: "yellow" }],
  [{ label: "Interview #", style: "yellow" }, { label: "Last Action", style: "yellow" }],
  [{ label: "Call History", style: "yellow" }, { label: "Resume #", style: "yellow" }],
  [{ label: "1st Call #", style: "yellow" }, { label: "Interview Date", style: "yellow" }],
  [{ label: "Main Points", style: "orange" }, null],
  [null, null],
  [null, null],
  [null, null],
] as const;

/** @deprecated Use EMPLOYEE_VIEWS_3_BUTTON_GRID */
export const EMPLOYEE_VIEWS_2_BUTTON_GRID = EMPLOYEE_VIEWS_3_BUTTON_GRID;

export const EMPLOYEE_VIEWS_TIME_FRAME = [
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

export const EMPLOYEE_VIEWS_TRADE_OPTIONS = [
  "All",
  "[ Elec - Lic  App ]",
  "[ Plumb - Lic  App ]",
  "[ HVAC - Lic  App ]",
  "Carpenter",
  "Operator",
  "Laborer",
] as const;

export const EMPLOYEE_VIEWS_STATE_OPTIONS = [
  "All",
  "MA",
  "NH",
  "ME",
  "VT",
  "RI",
  "CT",
  "NY",
] as const;

export const EMPLOYEE_VIEWS_COUNTY_OPTIONS = [
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

/** Views 4 — Profile filter */
export const EMPLOYEE_VIEWS_4_PROFILE = [
  "All",
  "[ EE Search 3 -",
  "Has Assign",
  "No Assign ]",
] as const;

export const EMPLOYEE_VIEWS_4_TIME_FOR = [
  "Last Week Ending w/ Assignment",
  "Last Action",
  "Last Call",
  "Future Call",
  "Interviewed",
  "Entry Date",
] as const;

export const EMPLOYEE_VIEWS_4_TIME_DURATION = [
  "All",
  "Exclude Current Wk",
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

export const EMPLOYEE_VIEWS_4_TRADE = [
  "All",
  "[Elec - Lic, App]",
  "[Plumb - Lic, App]",
  "[HVAC - Lic, App]",
  "Carpenter",
  "Operator",
  "Laborer",
] as const;

export const EMPLOYEE_VIEWS_4_IPG_STATUS = [
  "All",
  "N Ap",
  "SUB",
  "Sent",
  "I-9 Problem",
  "Sent-No Action",
  "RTG",
  "STP",
  "STP-OA",
  "RTG - EP",
] as const;

export const EMPLOYEE_MA_COPY_ROWS = [
  { label: "First + MI + Last", google: true },
  { label: "City + State", google: false },
  {
    label: "First + MI + Last + City + State",
    google: false,
    extraButtons: ["True People", "Elec B", "Plum B", "GA-F B", "SM-J B", "SM-A B"],
  },
  { label: "First + MI + Last + City + State + Trade", google: true },
] as const;

export const EMPLOYEE_NH_TRADE_BUTTONS = [
  "Electrician Journeyman",
  "Electrician Apprentice",
  "Journeyman Plumber",
  "Apprentice Plumber",
] as const;

export const EMPLOYEE_ADMIN_INCLUDE_PROFILES = [
  "Include [Main] Employee Search 3",
  "Include [Sub Div 1] Recruit",
  "Include [Sub Div 2] Research",
  "Include [Sub Div 3] Hold",
  "Include Health Care",
  "Include Profile 6",
  "Include Profile 7",
  "Include Profile 8",
  "Include Profile 9",
  "Include Profile 10",
] as const;

export const EMPLOYEE_CALL_LISTS_TRADE = EMPLOYEE_VIEWS_4_TRADE;

export const EMPLOYEE_CALL_LISTS_LIST = ["None", "1", "2", "3"] as const;

export const EMPLOYEE_INTERVIEW_DATE_OPTIONS = [
  "All",
  "All Interview Dates",
  "Last Week",
  "Day Before Yesterday",
  "Yesterday",
  "Today",
  "Tomorrow",
  "Day After Tomorrow",
  "This Week",
  "Next Week",
] as const;

export const EMPLOYEE_CALL_LISTS_2_ADDITIONAL = [
  "1. Available.",
  "2. Worked for us previously but are not assigned this week.",
  "3. Interview with positive ratings but have never being assigned.",
  "4. Strong resume ratings but have never been interviewed.",
  "5. All Others, Call / Text / Email.",
] as const;

export function employeeViews3BtnClass(style?: EmployeeViews3BtnStyle): string | undefined {
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

/** @deprecated Use employeeViews3BtnClass */
export const employeeViews2BtnClass = employeeViews3BtnClass;
