/** Employee Search grid columns — Access frmEmployeeSearch parity. */
export const EMPLOYEE_SEARCH_COLUMNS = [
  { key: "if", label: "IF" },
  { key: "ip", label: "IP(" },
  { key: "userFlag5", label: "User Flag 5" },
  { key: "online", label: "O(" },
  { key: "s1", label: "S1" },
  { key: "status", label: "EE Status" },
  { key: "profileType", label: "Profile Type" },
  { key: "firstName", label: "First Name" },
  { key: "middleInitial", label: "N" },
  { key: "lastName", label: "Last Name" },
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "alert", label: "!" },
  { key: "cellPhone", label: "Cell # 1" },
  { key: "cell", label: "Cell" },
  { key: "grade", label: "Grad" },
  { key: "howRef", label: "How Ref" },
  { key: "trade", label: "Trade" },
  { key: "qualification", label: "Qualificatio" },
  { key: "avgI", label: "Avg I" },
  { key: "fda", label: "FDA" },
  { key: "thw", label: "THW" },
  { key: "licExp", label: "Lic Exp D" },
  { key: "weekEnd", label: "Week End" },
  { key: "payRate", label: "Pay Rate" },
] as const;

export type EmployeeSearchColumnKey = (typeof EMPLOYEE_SEARCH_COLUMNS)[number]["key"];

export const EMPLOYEE_SEARCH_VIEW_TABS = [
  "Views 1",
  "Views 2",
  "Views 3",
  "Views 4",
  "MA",
  "NH",
  "User Settings",
  "Utilities",
  "Admin Utilities",
  "Ray",
  "Ray 2",
  "Interview",
  "Call Lists",
  "Call Lists 2",
] as const;

export type EmployeeSearchPresetStyle = "warn" | "bold" | "underline" | "multi" | "warn-underline" | "focus";

export type EmployeeSearchPresetCell = {
  label: string;
  style?: EmployeeSearchPresetStyle;
};

/** 3×10 preset grid — Views 1 tab. */
export const EMPLOYEE_SEARCH_PRESET_GRID: readonly (readonly (EmployeeSearchPresetCell | null)[])[] = [
  [
    { label: "Default", style: "underline" },
    { label: "Qualifications" },
    { label: "Sub Trades" },
    { label: "Age, Lic #, Level" },
    { label: "Car, RTS, RIP" },
    { label: "Email / Text" },
    { label: "Last Action" },
    { label: "Call History" },
    { label: "Future Call" },
    { label: "LA - CH - FC", style: "multi" },
  ],
  [
    { label: "Available Man" },
    { label: "UI" },
    { label: "Ref By / Bus Name" },
    { label: "Customer / Job Info" },
    { label: "Time Sheet Req" },
    { label: "Resume #" },
    { label: "1st Call #" },
    { label: "Interview Date" },
    null,
    { label: "Make Call List" },
  ],
  [
    { label: "I-P [Vax]" },
    { label: "RESUME #", style: "warn" },
    { label: "Recruiter. M Screen", style: "warn" },
    { label: "Call List Template", style: "bold" },
    { label: "Experience", style: "bold" },
    { label: "Remove ID's" },
    { label: "Get-Hired", style: "bold" },
    { label: "Research" },
    { label: "TEST 2 Screen", style: "bold" },
    { label: "EE SEARCH", style: "warn" },
  ],
] as const;

/** 3×10 preset grid — Views 2 tab. */
export const EMPLOYEE_SEARCH_VIEWS_2_GRID: readonly (readonly (EmployeeSearchPresetCell | null)[])[] = [
  [
    { label: "Default", style: "focus" },
    { label: "Qualifications" },
    { label: "Sub Trades" },
    { label: "Age, Lic #, Level" },
    { label: "Car, RTS, RIP", style: "underline" },
    { label: "Resume #", style: "underline" },
    { label: "Emergency #", style: "underline" },
    { label: "ID - Driver Lic", style: "underline" },
    { label: "Email / Text", style: "underline" },
    null,
  ],
  [
    { label: "Call History" },
    { label: "Future Call" },
    { label: "Customer / Job Info" },
    { label: "Time Sheet Req" },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    { label: "Available Man" },
    { label: "UI" },
    null,
    { label: "EE SEARCH", style: "warn-underline" },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
] as const;

export function employeeSearchPresetBtnClass(style?: EmployeeSearchPresetStyle): string | undefined {
  switch (style) {
    case "warn":
      return "ac-employee-search-btn-warn";
    case "warn-underline":
      return "ac-employee-search-btn-warn-underline";
    case "bold":
      return "ac-employee-search-btn-bold";
    case "underline":
      return "ac-employee-search-btn-underline";
    case "focus":
      return "ac-employee-views2-btn-focus";
    case "multi":
      return "ac-employee-search-btn-multi";
    default:
      return undefined;
  }
}
