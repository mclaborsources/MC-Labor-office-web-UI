import type { EmployeeSummary } from "@/types/employee";

export interface EmployeeSearchViews1Filters {
  datePreset?: string;
  dateField?: "WeekEndingDate" | "EmEntryDate";
  tracking?: string;
  dateRange?: string;
  cluster?: string;
  filter?: string;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isFinite(parsed.getTime())) return parsed;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  return match ? new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2])) : null;
}

function dateMatches(value: string, preset: string): boolean {
  if (!preset || preset === "All Dates") return true;
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (preset === "Today") return target.getTime() === startToday.getTime();
  if (preset === "Yesterday") { startToday.setDate(startToday.getDate() - 1); return target.getTime() === startToday.getTime(); }
  if (preset === "This Week" || preset === "Last Week") {
    const monday = new Date(startToday);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    if (preset === "Last Week") monday.setDate(monday.getDate() - 7);
    const end = new Date(monday); end.setDate(end.getDate() + 7);
    return target >= monday && target < end;
  }
  if (preset === "This Month") return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  if (preset === "Last Month") { const month = new Date(today.getFullYear(), today.getMonth() - 1, 1); return target.getFullYear() === month.getFullYear() && target.getMonth() === month.getMonth(); }
  if (preset === "Year-to-Date" || preset === "This Year") return target.getFullYear() === today.getFullYear();
  const days = preset === "Last 7 Days" ? 7 : preset === "Last 30 Days" ? 30 : preset === "Last 90 Days" ? 90 : 0;
  if (!days) return true;
  const start = new Date(startToday); start.setDate(start.getDate() - days + 1);
  return target >= start && target <= new Date(startToday.getTime() + 86_400_000);
}

function truthy(value: string | undefined): boolean {
  return Boolean(value?.trim()) && !["0", "false", "no", "n"].includes(value!.trim().toLowerCase());
}

/** Apply the employee search's date, tracking, cluster, and quick-filter controls. */
export function filterEmployeeSearchViews1Rows(rows: EmployeeSummary[], filters: EmployeeSearchViews1Filters): EmployeeSummary[] {
  const dateField = filters.dateField || "WeekEndingDate";
  return rows.filter(row => {
    const fields = row.accessFields;
    const tracking = filters.tracking;
    const assigned = Boolean(row.currentAssignment || fields.CustomerBusName || fields.SiteName);
    if ((tracking === "In Tracking" && !assigned) || (tracking === "Not in Tracking" && assigned)
      || (tracking === "Currently Assigned" && !row.currentAssignment && !fields.CustomerBusName && !fields.SiteName)
      || (tracking === "Not Assigned" && (row.currentAssignment || fields.CustomerBusName || fields.SiteName))) return false;

    const cluster = filters.cluster;
    if (cluster && cluster !== "All Clusters") {
      const rowCluster = (fields.Cluster || fields.ClusterName || fields.ClusterID || "").toLowerCase();
      if (rowCluster !== cluster.toLowerCase() && !rowCluster.includes(cluster.toLowerCase())) return false;
    }

    const preset = filters.dateRange && filters.dateRange !== "All Dates" ? filters.dateRange : filters.datePreset;
    const date = dateField === "WeekEndingDate" ? row.weekEnding || fields.WeekEndingDate || "" : fields.EmEntryDate || "";
    if (preset && !dateMatches(date, preset)) return false;

    const quick = filters.filter;
    if (quick === "Available Manpower" && !truthy(fields.PostEmployeeAsAvailableDate) && !truthy(fields.PostEmployeeAsAvailableText)) return false;
    if (quick === "UI" && !truthy(fields.EmployeeOnUnemploymentText)) return false;
    if (quick === "New Applicants" && !/new|applicant/i.test(fields.JobApplicationStatus_IPG || fields.EmployeeStatus || "")) return false;
    if (quick === "Get-Hired" && !/get.?hired|hire/i.test(row.status || fields.EmployeeStatus || fields.JobApplicationStatus_IPG || "")) return false;
    if (quick === "Interview" && !truthy(fields.InterviewedByDate) && !truthy(fields.InterviewNumber)) return false;
    if (quick === "Call List" && !truthy(fields.CallNumber) && !truthy(fields.LastCallDate)) return false;
    return true;
  });
}
