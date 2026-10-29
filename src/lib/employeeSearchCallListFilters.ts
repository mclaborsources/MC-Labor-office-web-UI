import type { EmployeeSummary } from "@/types/employee";

export type EmployeeSearchCallListFilters = Partial<Record<"trade" | "state" | "county" | "list", string>>;

const LIST_VALUE_KEYS = ["EmployeeCallList", "CallList", "CallListNumber", "CallListID", "EmployeeCallListID"];
const LIST_FLAG_KEYS = (list: string) => [`CallList${list}`, `EmployeeCallList${list}`, `CallList${list}Flag`, `EmployeeCallList${list}Flag`];

function matchesTrade(value: string, choice: string): boolean {
  const v = value.toLocaleLowerCase().trim();
  const c = choice.toLocaleLowerCase().trim();
  if (!c || c === "all") return true;
  if (c.startsWith("[elec")) return /electric|elec/.test(v);
  if (c.startsWith("[plumb")) return /plumb/.test(v);
  if (c.startsWith("[hvac")) return /hvac|sheet metal/.test(v);
  return v === c || v.includes(c);
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/ county$/, "");
}

function matchesList(row: EmployeeSummary, list: string): boolean {
  if (!list || list === "None") return true;
  const fields = row.accessFields;
  const values = LIST_VALUE_KEYS.map(key => fields[key]?.trim() ?? "").filter(Boolean);
  if (values.length) return values.some(value => value === list || value === `List ${list}`);
  const flags = LIST_FLAG_KEYS(list).map(key => fields[key]?.trim() ?? "").filter(Boolean);
  if (flags.length) return flags.some(value => !["0", "false", "no", "n"].includes(value.toLowerCase()));
  return true;
}

/** Apply the documented Trade, State, County and optional list membership filters. */
export function filterEmployeeSearchCallListRows(rows: EmployeeSummary[], filters: EmployeeSearchCallListFilters): EmployeeSummary[] {
  return rows.filter(row => {
    if (!matchesTrade(row.trade || row.accessFields.EmTrade || "", filters.trade ?? "All")) return false;
    if (filters.state && filters.state !== "All" && normalize(row.state || row.accessFields.EmState || "") !== normalize(filters.state)) return false;
    const county = row.accessFields.CountyFilter || row.accessFields.County || "";
    if (filters.county && filters.county !== "All" && normalize(county) !== normalize(filters.county)) return false;
    return matchesList(row, filters.list ?? "None");
  });
}

