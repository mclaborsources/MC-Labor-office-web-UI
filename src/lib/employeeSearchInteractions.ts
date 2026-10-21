import type { EmployeeSummary } from "@/types/employee";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export function compareEmployeesAccessOrder(a: EmployeeSummary, b: EmployeeSummary): number {
  const date = (value: string) => Date.parse(value) || 0;
  return date(b.weekEnding) - date(a.weekEnding) || collator.compare(a.firstName, b.firstName) || collator.compare(a.lastName, b.lastName) || collator.compare(a.middleInitial, b.middleInitial);
}

export function filterEmployeeSearch(rows: EmployeeSummary[], values: Record<string, string>): EmployeeSummary[] {
  const name = values.Name?.trim().toLowerCase();
  const phone = values["Cell #"]?.replace(/\D/g, "");
  const email = values.Email?.trim().toLowerCase();
  const text = values.Text?.trim().toLowerCase();
  const license = values["Lic #"]?.trim().toLowerCase();
  return rows.filter(row => {
    if (name && !`${row.firstName} ${row.middleInitial || ""} ${row.lastName}`.replace(/\s+/g, " ").toLowerCase().includes(name) && !row.fullName?.toLowerCase().includes(name)) return false;
    if (values["Cell #"]?.trim() && (!phone || !row.cellPhone.replace(/\D/g, "").includes(phone))) return false;
    if (email && !row.email.toLowerCase().includes(email)) return false;
    if (text && !Object.entries(row.accessFields).some(([key, value]) => /TextMsgAddress/i.test(key) && value.toLowerCase().includes(text))) return false;
    if (license && !Object.entries(row.accessFields).some(([key, value]) => /License.*Num|Lic.*Number/i.test(key) && value.toLowerCase().includes(license))) return false;
    return true;
  });
}
