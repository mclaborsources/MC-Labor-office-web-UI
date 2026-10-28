import { CUSTOMER_NAME_SEARCH_COLUMNS, customerNameCellValue, type CustomerNameMatch } from "./customerNameSearchColumns";

export type CustomerSearch1Filters = Partial<Record<
  "search" | "customerType" | "custStatus" | "profileType" | "state" | "city" | "internetSalesReady" |
  "inTracking" | "fromDate" | "toDate" | "dateRange" | "clusterCities" | "duplicates", string>>;

export type CustomerSearchViews3Filters = Partial<Record<
  "progress" | "profile" | "timeFrame" | "timeDuration" | "trade" | "state" | "county" | "userFlag" | "userValue", string>>;

function parseDate(value: string): Date | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

function dateMatchesDuration(dateValue: string, duration: string): boolean {
  const date = parseDate(dateValue);
  if (!date) return false;
  const today = new Date();
  const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));
  const nextMonday = new Date(thisMonday); nextMonday.setDate(nextMonday.getDate() + 7);
  const previousMonday = new Date(thisMonday); previousMonday.setDate(previousMonday.getDate() - 7);
  const daysOld = (today.getTime() - date.getTime()) / 86_400_000;
  if (duration === "Current Wk") return date >= thisMonday && date < nextMonday;
  if (duration === "Last Wk") return date >= previousMonday && date < thisMonday;
  if (duration === "Exclude Current Wk") return date < thisMonday;
  const ranges: Record<string, [number, number]> = {
    ">1 - 4 Wks": [7, 28], ">4 - 8 Wks": [28, 56], ">8 - 12 Wks": [56, 84],
    ">12 - 24 Wks": [84, 168], ">24 - 36 Wks": [168, 252], ">36 - 52 Wks": [252, 365],
    ">1 - 2 Yrs": [365, 730], ">2 - 3 Yrs": [730, 1095], ">3 - 4 Yrs": [1095, 1460],
    ">4 - 5 Yrs": [1460, 1825], ">5 Yrs": [1825, Number.POSITIVE_INFINITY],
  };
  const range = ranges[duration];
  return !range || (daysOld >= range[0] && daysOld < range[1]);
}

/** Applies the legacy Views 3 radio criteria to the already-loaded Customer Search 1 rows. */
export function filterCustomerSearch1Views3Rows(rows: CustomerNameMatch[], filters: CustomerSearchViews3Filters): CustomerNameMatch[] {
  const timeframeFields: Record<string, keyof CustomerNameMatch> = {
    "Last Week Ending w/ Assignment": "lastWeekEnding", "Last Action": "lastActionDate",
    "Last Call": "lastCallDate", "Future Call": "futureCall", "Permit Pulled": "permitDate",
    "Office Visit": "officeVisitDate", "Site Visit": "siteVisitDate",
  };
  const dateKey = filters.timeFrame ? timeframeFields[filters.timeFrame] : undefined;
  const duration = filters.timeDuration && filters.timeDuration !== "All" ? filters.timeDuration : "";
  const flagIndex = Number(filters.userFlag);
  const flagKey = flagIndex >= 1 && flagIndex <= 8 ? `spare${flagIndex}` as keyof CustomerNameMatch : undefined;
  return rows.filter(row => {
    switch (filters.progress) {
      case "Cu Invoiced": if (!row.lastInvoiceNumber && !row.lastInvoiceDate) return false; break;
      case "Cu w/ Signed Contract, Not Invoiced": if (!row.hasSignedContract || row.lastInvoiceNumber || row.lastInvoiceDate) return false; break;
      case "Cu sent Sales Package": if (!row.salesPackageSentFilter && !row.salesPackageSentDate && !row.salesPackageSent) return false; break;
    }
    switch (filters.profile) {
      case "[ Cust Search -": if (row.profileType !== "Customer Search") return false; break;
      case "Has Assign": if (!row.hasAssignment) return false; break;
      case "No Assign": if (row.hasAssignment) return false; break;
      case "No C ]": if (!row.noCommunication) return false; break;
      case "Spare 1": case "Spare 2": case "Spare 3": if (row.profileType !== filters.profile) return false; break;
    }
    if (filters.trade && filters.trade !== "All") {
      const type = row.customerType.toLowerCase();
      const needle = filters.trade === "HVAC / Sheet Metal" ? ["hvac", "sheet metal"] : [filters.trade.toLowerCase()];
      if (!needle.some(value => type.includes(value))) return false;
    }
    if (filters.state && filters.state !== "All" && row.state.toUpperCase() !== filters.state.toUpperCase()) return false;
    if (filters.county && filters.county !== "All" && row.countyFilter.toLowerCase().replace(/ county$/, "") !== filters.county.toLowerCase().replace(/ county$/, "")) return false;
    if (dateKey && duration && !dateMatchesDuration(String(row[dateKey] ?? ""), duration)) return false;
    if (flagKey && filters.userValue && filters.userValue !== "All") {
      const value = String(row[flagKey] ?? "");
      if (filters.userValue === "[BLANK]" ? value !== "" : value !== filters.userValue) return false;
    }
    return true;
  });
}

/** Chunked equivalent used by the UI so radio selection and the loading timer stay responsive. */
export async function filterCustomerSearch1Views3RowsAsync(
  rows: CustomerNameMatch[],
  filters: CustomerSearchViews3Filters,
  shouldCancel: () => boolean = () => false,
): Promise<CustomerNameMatch[] | null> {
  const filtered: CustomerNameMatch[] = [];
  const chunkSize = 2500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    if (shouldCancel()) return null;
    const end = Math.min(start + chunkSize, rows.length);
    filtered.push(...filterCustomerSearch1Views3Rows(rows.slice(start, end), filters));
    if (end < rows.length) await new Promise<void>(resolve => window.setTimeout(resolve, 0));
  }
  return filtered;
}

function buildCustomerSearch1Predicate(rows: CustomerNameMatch[], filters: CustomerSearch1Filters): (row: CustomerNameMatch) => boolean {
  const query = filters.search?.trim().toLowerCase() ?? "";
  const fromDate = filters.fromDate ? Date.parse(`${filters.fromDate}T00:00:00`) : null;
  const toDate = filters.toDate ? Date.parse(`${filters.toDate}T23:59:59.999`) : null;
  const exactKeys = ["customerType", "custStatus", "profileType", "state", "city", "internetSalesReady"] as const;
  const duplicateKeys = ["customerName", "street", "ctcEmail", "ctcCell"] as const;
  const duplicateKey = duplicateKeys.find(key => key === filters.duplicates);
  let clusterCities = new Set<string>();
  try { clusterCities = new Set(JSON.parse(filters.clusterCities ?? "[]") as string[]); } catch { /* ignore malformed saved filter state */ }
  const counts = new Map<string, number>();
  if (duplicateKey) for (const row of rows) {
    const value = row[duplicateKey].trim().toLowerCase();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return row => {
    if (query && !CUSTOMER_NAME_SEARCH_COLUMNS.some(column => customerNameCellValue(row, column.key).toLowerCase().includes(query))) return false;
    if (!exactKeys.every(key => !filters[key] || row[key] === filters[key])) return false;
    const inTracking = Boolean(row.firstWeekEnding || row.lastWeekEnding);
    if (filters.inTracking === "yes" && !inTracking || filters.inTracking === "no" && inTracking) return false;
    if (clusterCities.size && !clusterCities.has(`${row.city}\u001f${row.state}`)) return false;
    if (fromDate !== null || toDate !== null) {
      const date = Date.parse(row.lastWeekEnding);
      if (!Number.isFinite(date) || fromDate !== null && date < fromDate || toDate !== null && date > toDate) return false;
    }
    if (duplicateKey && (counts.get(row[duplicateKey].trim().toLowerCase()) ?? 0) < 2) return false;
    return true;
  };
}

export function filterCustomerSearch1Rows(rows: CustomerNameMatch[], filters: CustomerSearch1Filters): CustomerNameMatch[] {
  const predicate = buildCustomerSearch1Predicate(rows, filters);
  return rows.filter(predicate);
}

export async function filterCustomerSearch1RowsAsync(
  rows: CustomerNameMatch[],
  filters: CustomerSearch1Filters,
  shouldCancel: () => boolean = () => false,
): Promise<CustomerNameMatch[] | null> {
  const predicate = buildCustomerSearch1Predicate(rows, filters);
  const filtered: CustomerNameMatch[] = [];
  const chunkSize = 2500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    if (shouldCancel()) return null;
    const end = Math.min(start + chunkSize, rows.length);
    for (let index = start; index < end; index++) if (predicate(rows[index])) filtered.push(rows[index]);
    if (end < rows.length) await new Promise<void>(resolve => window.setTimeout(resolve, 0));
  }
  return filtered;
}
