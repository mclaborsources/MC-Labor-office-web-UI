export const CUSTOMER_NAME_SEARCH_COLUMNS = [
  { key: "customerName", label: "Name", width: 280, kind: "text" },
  { key: "profileType", label: "Profile Type", width: 160, kind: "text" },
  { key: "entryUserName", label: "Entry User Name", width: 160, kind: "text" },
  { key: "entryDate", label: "Entry Date", width: 120, kind: "date" },
  { key: "customerType", label: "Customer Type", width: 200, kind: "text" },
  { key: "street", label: "Street", width: 220, kind: "text" },
  { key: "city", label: "City", width: 140, kind: "text" },
  { key: "state", label: "State", width: 70, kind: "text" },
  { key: "noCommunication", label: "No Communication", width: 160, kind: "text" },
  { key: "firstWeekEnding", label: "First Week Ending", width: 160, kind: "date" },
  { key: "lastWeekEnding", label: "Last Week Ending", width: 160, kind: "date" },
  { key: "internetSalesReadyUser", label: "Internet Sales Ready User", width: 200, kind: "text" },
  { key: "internetSalesReadyDate", label: "Internet Sales Ready Date", width: 200, kind: "date" },
  { key: "internetSalesReady", label: "Internet Sales Ready", width: 200, kind: "text" },
  { key: "custStatus", label: "Cust Status", width: 160, kind: "text" },
  { key: "salesAdmin", label: "S Adm (Sales Admin)", width: 170, kind: "text" },
  { key: "act", label: "Act", width: 80, kind: "number" },
  { key: "futureCallUser", label: "Future Call User", width: 160, kind: "text" },
  { key: "futureCallUserDate", label: "Future Call User Date", width: 170, kind: "date" },
  { key: "futureCall", label: "Future Call", width: 130, kind: "date" },
  { key: "futureCallHistory", label: "Future Call History", width: 240, kind: "text" },
  { key: "futureCallUserTime", label: "Future Call User Time", width: 170, kind: "text" },
  { key: "lastActionUser", label: "Last Action User", width: 160, kind: "text" },
  { key: "lastActionDate", label: "Last Action Date", width: 150, kind: "date" },
  { key: "lastAction", label: "Last Action", width: 220, kind: "text" },
  { key: "lastActionNote", label: "Last Action Note", width: 280, kind: "text" },
  { key: "ctcFirst", label: "Ctc First", width: 150, kind: "text" },
  { key: "ctcLast", label: "Ctc Last", width: 150, kind: "text" },
  { key: "ctcTitle", label: "Ctc Title", width: 180, kind: "text" },
  { key: "ctcEmail", label: "Ctc Email", width: 240, kind: "text" },
  { key: "ctcCell", label: "Ctc Cell", width: 150, kind: "text" },
] as const;

export type CustomerNameColumnKey = typeof CUSTOMER_NAME_SEARCH_COLUMNS[number]["key"];
export type CustomerNameMatch = { customerId: string; noCommunication: boolean } &
  Record<Exclude<CustomerNameColumnKey, "noCommunication">, string>;

export function customerNameCellValue(customer: CustomerNameMatch, key: CustomerNameColumnKey): string {
  return key === "noCommunication" ? (customer.noCommunication ? "Yes" : "No") : customer[key];
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export function compareCustomerNameValues(left: string, right: string, kind: "text" | "date" | "number"): number {
  if (kind === "date" && left && right) {
    const a = Date.parse(left), b = Date.parse(right);
    if (Number.isFinite(a) && Number.isFinite(b)) return a - b;
  }
  if (kind === "number" && left && right) return Number(left) - Number(right);
  return collator.compare(left, right);
}
