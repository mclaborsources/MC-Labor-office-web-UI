import type { CustomerSearchPresetCell } from "@/lib/customerSearchColumns";

/** Views tab — Progress filter radios */
export const CUSTOMER_VIEWS_PROGRESS_OPTIONS = [
  "Cu in System (All)",
  "Cu Invoiced",
  "Cu w/ Signed Contract, Not Invoiced",
  "Cu sent Sales Package",
] as const;

/** Views tab — Profile filter radios */
export const CUSTOMER_VIEWS_PROFILE_OPTIONS = [
  "All",
  "[ Cust Search -",
  "Has Assign",
  "No Assign",
  "No C ]",
  "Spare 1",
  "Spare 2",
  "Spare 3",
] as const;

/** Views tab — Time Frame category */
export const CUSTOMER_VIEWS_TIME_FRAME_FOR_OPTIONS = [
  "Last Week Ending w/ Assignment",
  "Last Action",
  "Last Call",
  "Future Call",
  "Permit Pulled",
  "Office Visit",
  "Site Visit",
] as const;

/** Views tab — Time Frame duration */
export const CUSTOMER_VIEWS_TIME_DURATION_OPTIONS = [
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

export const CUSTOMER_VIEWS_TRADE_OPTIONS = [
  "All",
  "Electrical",
  "Plumbing",
  "HVAC / Sheet Metal",
  "Carpenter",
] as const;

export const CUSTOMER_VIEWS_STATE_OPTIONS = [
  "All",
  "MA",
  "NH",
  "ME",
  "VT",
  "RI",
  "CT",
  "NY",
] as const;

export const CUSTOMER_VIEWS_COUNTY_OPTIONS = [
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

/** Views 2 tab — 8×4 preset grid (Access screenshot). */
export const CUSTOMER_SEARCH_VIEWS_2_GRID: readonly (readonly (CustomerSearchPresetCell | "textured" | null)[])[] = [
  [{ label: "Deepak", style: "warn" }, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, "textured", null, null, null, null, null, null],
] as const;

export type AdminTransferButton = {
  label: string;
  color: string;
};

/** Admin Utilities — Transfer to button grid */
export const CUSTOMER_ADMIN_TRANSFER_BUTTONS: readonly (readonly (AdminTransferButton | null)[])[] = [
  [
    { label: "Cust Search", color: "#d9d9d9" },
    { label: "PPP Loans", color: "#fff200" },
    { label: "D&B", color: "#ffc20e" },
    { label: "Hold", color: "#ffb3b3" },
  ],
  [
    { label: "Research", color: "#8bd0ff" },
    null,
    { label: "Spare 1", color: "#75e595" },
    { label: "Spare 2", color: "#dac19b" },
  ],
  [
    { label: "Spare 3", color: "#d96b77" },
    { label: "Health Care", color: "#8c8c8c" },
    { label: "Spare 4", color: "#ffe9ab" },
    { label: "Spare 5", color: "#0095fa" },
  ],
  [
    { label: "Spare 6", color: "#20ac48" },
    { label: "Spare 7", color: "#e1cdef" },
    { label: "Spare 8", color: "#41f1e9" },
    null,
  ],
] as const;

/** Admin Utilities — Include profiles checkboxes (4 columns) */
export const CUSTOMER_ADMIN_INCLUDE_PROFILES = [
  ["Cust Search", "PPP Loans", "D&B", "Hold"],
  ["Research", "Deleted", "Spare 1", "Spare 2"],
  ["Spare 3", "Health Care", "Spare 4", "Spare 5"],
  ["Spare 6", "Spare 7", "Spare 8", null],
] as const;
