import type { EmployeeSummary } from "@/types/employee";

export type EmployeeSearchUtilityFilters = {
  licenseYear?: string;
  noContactRange?: string;
  duplicates?: string;
};

export type EmployeeCallNumberFilter = "none" | "available" | "interview";

export function filterEmployeeSearchCallNumber(rows: EmployeeSummary[], filter: EmployeeCallNumberFilter): EmployeeSummary[] {
  if (filter === "none") return rows;
  const pattern = filter === "available" ? /available|work/i : /schedule|interview/i;
  return rows.filter(row => {
    const callNumber = row.accessFields.CallNumber ?? "";
    return pattern.test(callNumber);
  });
}

function dateValue(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isFinite(parsed.getTime())) return parsed;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  return match ? new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2])) : null;
}

function duplicateKey(row: EmployeeSummary, mode: string): string {
  const f = row.accessFields;
  const name = [row.firstName, row.middleInitial, row.lastName].filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ").trim();
  const street = (row.street || f.EmStreet || "").toLowerCase().replace(/\s+/g, " ").trim();
  const city = (row.city || f.EmCity || "").toLowerCase().replace(/\s+/g, " ").trim();
  const state = (row.state || f.EmState || "").toLowerCase().replace(/\s+/g, " ").trim();
  const phone = (row.cellPhone || f.EmHomePhone || "").replace(/\D/g, "");
  const compact = (value: string) => value.replace(/\s/g, "");
  switch (mode) {
    case "Name": return compact(name);
    case "Name, Backwards": return compact(name).split("").reverse().join("");
    case "Street": return compact(street);
    case "Street, Backwards": return compact(street).split("").reverse().join("");
    case "Phone": return phone;
    case "Phone, Backwards": return phone.split("").reverse().join("");
    case "Name + Street": return [compact(name), compact(street)].join("|");
    case "Name + Street + City": return [compact(name), compact(street), compact(city)].join("|");
    case "Name + Street + City + Phone": return [compact(name), compact(street), compact(city), phone].join("|");
    case "Name + City": return [compact(name), compact(city)].join("|");
    case "Name + State": return [compact(name), compact(state)].join("|");
    case "Street + City": return [compact(street), compact(city)].join("|");
    default: return "";
  }
}

export function filterEmployeeSearchUtilities(rows: EmployeeSummary[], filters: EmployeeSearchUtilityFilters): EmployeeSummary[] {
  let result = rows;
  const year = filters.licenseYear ?? "";
  if (year && year !== "All Years") result = result.filter(row => {
    const value = row.accessFields.LicenseIssueDateYear || row.accessFields.LicenseIssueDate || "";
    const parsedYear = Number(value.match(/(?:19|20)\d{2}/)?.[0] ?? "");
    return year === "2020 and Earlier" ? parsedYear > 0 && parsedYear <= 2020 : parsedYear === Number(year);
  });
  const range = filters.noContactRange ?? "";
  if (range) {
    const days = range === "6 Months" ? 183 : range === "1 Year" ? 365 : Number(range.match(/^\d+/)?.[0] ?? "0");
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
    result = result.filter(row => {
      const lastContact = dateValue(row.accessFields.EmployeeContactHistoryDate || "");
      return !lastContact || lastContact < cutoff;
    });
  }
  const mode = filters.duplicates ?? "";
  if (mode) {
    const keys = result.map(row => duplicateKey(row, mode));
    const counts = new Map<string, number>();
    for (const key of keys) if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    result = result.filter(row => {
      const key = duplicateKey(row, mode);
      return Boolean(key) && (counts.get(key) ?? 0) > 1;
    });
  }
  return result;
}
