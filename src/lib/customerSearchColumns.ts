/** Customer Search grid columns — Access frmCustomerSearch parity (Phase A). */
export const CUSTOMER_SEARCH_COLUMNS = [
  { key: "select", label: "" },
  { key: "name", label: "Name" },
  { key: "noCommunication", label: "No Communication" },
  { key: "street", label: "Street" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "customerType", label: "Cust Type" },
  { key: "lastWeekEnding", label: "Last Week Ending" },
  { key: "firstWeekEnding", label: "First Week Ending" },
  { key: "act", label: "Act" },
  { key: "internetSalesReadyUser", label: "Internet Sales Ready User" },
  { key: "internetSalesReadyDate", label: "Internet Sales Ready Date" },
  { key: "internetSalesReady", label: "Internet Sales Ready" },
  { key: "lastActionUser", label: "Last Action User" },
  { key: "lastActionDate", label: "Last Action Date" },
  { key: "lastAction", label: "Last Action" },
  { key: "futureCallUser", label: "Future Call User" },
  { key: "futureCallUserDate", label: "Future Call User Date" },
  { key: "futureCallUserTime", label: "Future Call User Time" },
  { key: "futureCall", label: "Future Call" },
  { key: "futureCallHistory", label: "Future Call History" },
  { key: "salesHStatus", label: "Sales H Status" },
  { key: "contacts", label: "Contacts" },
  { key: "licenseNumber", label: "License Number" },
  { key: "licenseIssueDate", label: "License Issue Date" },
  { key: "licenseExpireDate", label: "License Expire Date" },
  { key: "salesPackageSentFilter", label: "Sales Package Sent Filter" },
  { key: "salesPackageSentDate", label: "Sales Package Sent Date" },
  { key: "salesPackageSentUser", label: "Sales Package Sent User" },
  { key: "contactCount", label: "Contact Count" },
] as const;

export type CustomerSearchColumnKey = (typeof CUSTOMER_SEARCH_COLUMNS)[number]["key"];

export const CUSTOMER_SEARCH_VIEW_TABS = [
  "Views",
  "Views 2",
  "Views 3",
  "Internet Search",
  "User Settings",
  "Utilities",
  "Admin Utilities",
  "Ray",
] as const;

export type CustomerSearchPresetStyle = "warn" | "info" | "warn-underline" | "info-underline";

export type CustomerSearchPresetCell = {
  label: string;
  style?: CustomerSearchPresetStyle;
};

/** 8-column preset button grid — Access frmCustomerSearch Views tab. */
export const CUSTOMER_SEARCH_PRESET_GRID: readonly (readonly (CustomerSearchPresetCell | null)[])[] = [
  [
    { label: "Default" },
    { label: "Customer Info" },
    { label: "Blast Email" },
    { label: "Blast Test" },
    { label: "Site / Office V" },
    { label: "Cold / Dor Cal" },
    { label: "Email / Mailer" },
    null,
  ],
  [
    { label: "Ryan-Eamon Brian" },
    { label: "Siobhan 1" },
    { label: "Profile Type" },
    { label: "Kick Backs" },
    null,
    null,
    null,
    null,
  ],
  [
    { label: "Select Profile", style: "warn" },
    { label: "Siobhan 2" },
    null,
    null,
    null,
    null,
    { label: "Test 1 Screen" },
    { label: "Test 2 Screen" },
  ],
  [
    { label: "RTS" },
    { label: "Siobhan 2 Screens", style: "warn-underline" },
    { label: "Sales Package $", style: "info-underline" },
    { label: "Call List Template" },
    null,
    null,
    null,
    null,
  ],
] as const;

export function customerSearchPresetBtnClass(style?: CustomerSearchPresetStyle): string | undefined {
  switch (style) {
    case "warn":
      return "ac-customer-search-btn-warn";
    case "info":
      return "ac-customer-search-btn-info";
    case "warn-underline":
      return "ac-customer-search-btn-warn-underline";
    case "info-underline":
      return "ac-customer-search-btn-info-underline";
    default:
      return undefined;
  }
}
