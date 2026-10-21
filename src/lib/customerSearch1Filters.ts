import { CUSTOMER_NAME_SEARCH_COLUMNS, customerNameCellValue, type CustomerNameMatch } from "./customerNameSearchColumns";

export type CustomerSearch1Filters = Partial<Record<
  "search" | "customerType" | "custStatus" | "profileType" | "state" | "city" | "internetSalesReady" |
  "inTracking" | "fromDate" | "toDate" | "duplicates", string>>;

export function filterCustomerSearch1Rows(rows: CustomerNameMatch[], filters: CustomerSearch1Filters): CustomerNameMatch[] {
  const query = filters.search?.trim().toLowerCase() ?? "";
  const fromDate = filters.fromDate ? Date.parse(`${filters.fromDate}T00:00:00`) : null;
  const toDate = filters.toDate ? Date.parse(`${filters.toDate}T23:59:59.999`) : null;
  const exactKeys = ["customerType", "custStatus", "profileType", "state", "city", "internetSalesReady"] as const;
  const duplicateKeys = ["customerName", "street", "ctcEmail", "ctcCell"] as const;
  const duplicateKey = duplicateKeys.find(key => key === filters.duplicates);
  const counts = new Map<string, number>();
  if (duplicateKey) for (const row of rows) {
    const value = row[duplicateKey].trim().toLowerCase();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return rows.filter(row => {
    if (query && !CUSTOMER_NAME_SEARCH_COLUMNS.some(column => customerNameCellValue(row, column.key).toLowerCase().includes(query))) return false;
    if (!exactKeys.every(key => !filters[key] || row[key] === filters[key])) return false;
    const inTracking = Boolean(row.firstWeekEnding || row.lastWeekEnding);
    if (filters.inTracking === "yes" && !inTracking || filters.inTracking === "no" && inTracking) return false;
    if (fromDate !== null || toDate !== null) {
      const date = Date.parse(row.lastWeekEnding);
      if (!Number.isFinite(date) || fromDate !== null && date < fromDate || toDate !== null && date > toDate) return false;
    }
    if (duplicateKey && (counts.get(row[duplicateKey].trim().toLowerCase()) ?? 0) < 2) return false;
    return true;
  });
}
