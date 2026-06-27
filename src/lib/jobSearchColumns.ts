/** Job Search grid columns — Access-style dense grid with wired + placeholder cols. */
export const JOB_SEARCH_COLUMNS = [
  { key: "status", label: "Status" },
  { key: "jobId", label: "Job ID" },
  { key: "customerName", label: "Customer" },
  { key: "jobName", label: "Job / Site Name" },
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "salesman", label: "Salesman" },
  { key: "customerType", label: "Type" },
  { key: "foremanName", label: "Foreman" },
  { key: "startDate", label: "Start" },
  { key: "endDate", label: "End" },
  { key: "weekEnd", label: "Week End" },
  { key: "assignCount", label: "# Assign" },
  { key: "contract", label: "Contract" },
  { key: "gcOnSite", label: "GC On Site" },
  { key: "officeNote", label: "Office Note" },
  { key: "jobNote", label: "Job Note" },
  { key: "entryUser", label: "Entry User" },
  { key: "entryDate", label: "Entry Dt" },
  { key: "profileType", label: "Profile Type" },
  { key: "cluster", label: "Cluster" },
  { key: "trade", label: "Trade" },
  { key: "county", label: "County" },
  { key: "flag1", label: "Flag 1" },
] as const;

export type JobSearchColumnKey = (typeof JOB_SEARCH_COLUMNS)[number]["key"];

export const JOB_SEARCH_VIEW_TABS = [
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
  "Schedule",
  "Call Lists",
  "Call Lists 2",
] as const;

export type JobSearchPresetStyle = "warn" | "bold" | "underline" | "multi" | "warn-underline" | "focus";

export type JobSearchPresetCell = {
  label: string;
  style?: JobSearchPresetStyle;
};

/** 3×10 preset grid — Views 1 tab. */
export const JOB_SEARCH_PRESET_GRID: readonly (readonly (JobSearchPresetCell | null)[])[] = [
  [
    { label: "Default", style: "underline" },
    { label: "Active Jobs" },
    { label: "By Customer" },
    { label: "By Salesman" },
    { label: "By Foreman" },
    { label: "By City" },
    { label: "By Status" },
    { label: "Start Date" },
    { label: "End Date" },
    { label: "All Fields", style: "multi" },
  ],
  [
    { label: "Open Jobs" },
    { label: "Closed Jobs" },
    { label: "This Week" },
    { label: "Last Week" },
    { label: "Assignments" },
    { label: "No Assign" },
    { label: "GC On Site" },
    { label: "Office Note" },
    null,
    { label: "Export View" },
  ],
  [
    { label: "Site Data" },
    { label: "Contract", style: "warn" },
    { label: "Rate Report", style: "warn" },
    { label: "Instructions", style: "bold" },
    { label: "Lien Menu", style: "bold" },
    { label: "Sub Jobs" },
    { label: "Tracking Link" },
    { label: "Customer Prof" },
    { label: "TEST Screen", style: "bold" },
    { label: "JOB SEARCH", style: "warn" },
  ],
] as const;

/** 3×10 preset grid — Views 2 tab. */
export const JOB_SEARCH_VIEWS_2_GRID: readonly (readonly (JobSearchPresetCell | null)[])[] = [
  [
    { label: "Default", style: "focus" },
    { label: "Active Jobs" },
    { label: "By Customer" },
    { label: "By Salesman" },
    { label: "By City", style: "underline" },
    { label: "By Status", style: "underline" },
    { label: "Start Date", style: "underline" },
    { label: "End Date", style: "underline" },
    { label: "Foreman", style: "underline" },
    null,
  ],
  [
    { label: "Open Jobs" },
    { label: "Closed Jobs" },
    { label: "Assignments" },
    { label: "No Assign" },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [
    { label: "This Week" },
    { label: "Last Week" },
    null,
    { label: "JOB SEARCH", style: "warn-underline" },
    null,
    null,
    null,
    null,
    null,
    null,
  ],
] as const;

export function jobSearchPresetBtnClass(style?: JobSearchPresetStyle): string | undefined {
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
