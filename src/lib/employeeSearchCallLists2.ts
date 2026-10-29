import type { EmployeeSummary } from "@/types/employee";

export type EmployeeSearchCallLists2Filters = {
  cluster?: string;
  trade?: string;
  qualification?: string;
  lastAction?: string;
  lastCall?: string;
  noSubs?: string;
  additional?: string;
  newEntryDays?: string[];
  newUnassignedDays?: string[];
};

export type EmployeeCallLists2Options = {
  clusters: string[];
  trades: string[];
  qualifications: string[];
  lastActions: string[];
};

function unique(values: string[]) {
  return [...new Set(values.map(value => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getEmployeeCallLists2Options(rows: EmployeeSummary[]): EmployeeCallLists2Options {
  const fieldValues = (keys: string[]) => unique(rows.flatMap(row => keys.map(key => row.accessFields[key] ?? "")));
  return {
    clusters: fieldValues(["ClusterName", "Cluster"]).length ? fieldValues(["ClusterName", "Cluster"]) : fieldValues(["ClusterID"]),
    trades: unique(rows.map(row => row.trade || row.accessFields.EmTrade || "")),
    qualifications: unique(rows.map(row => row.qualification || row.accessFields.EmQualification || "")),
    lastActions: fieldValues(["EmployeeContactHistoryActionType", "LastAction"]),
  };
}

function truthy(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return Boolean(normalized) && !["0", "false", "no", "n", "none", "null"].includes(normalized);
}

function anyField(row: EmployeeSummary, keys: string[]): boolean {
  return keys.some(key => truthy(row.accessFields[key]));
}

function assignedThisWeek(row: EmployeeSummary): boolean {
  return Boolean(row.currentAssignment || row.accessFields.CustomerBusName || row.accessFields.SiteName);
}

function hasSubTrade(row: EmployeeSummary): boolean {
  return ["SubTrade1", "SubTrade2", "SubTrade3", "SubTrade4", "SubTrade1ID", "SubTrade2ID", "SubTrade3ID", "SubTrade4ID"]
    .some(key => truthy(row.accessFields[key]));
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isFinite(parsed.getTime())) return parsed;
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  return us ? new Date(Number(us[3]), Number(us[1]) - 1, Number(us[2])) : null;
}

function withinDays(value: string | undefined, days: number): boolean {
  const date = parseDate(value);
  if (!date) return false;
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return date >= start && date < end;
}

function matchesLastCall(row: EmployeeSummary, choice: string): boolean {
  if (!choice || choice === "Any Last Call") return true;
  const value = row.accessFields.LastCallDate || row.accessFields.CallDate || "";
  if (choice === "Never Called") return !parseDate(value) && !truthy(row.accessFields.LastCallNote) && !truthy(row.accessFields.CallNumber);
  const date = parseDate(value);
  if (!date) return false;
  if (choice === "Today") return withinDays(value, 1);
  if (choice === "Last 7 Days") return withinDays(value, 7);
  if (choice === "Last 30 Days") return withinDays(value, 30);
  if (choice === "Over 30 Days") return date < new Date(Date.now() - 30 * 86_400_000);
  return true;
}

function matchAdditional(row: EmployeeSummary, filters: EmployeeSearchCallLists2Filters): boolean {
  const choice = filters.additional ?? "All";
  const assigned = assignedThisWeek(row);
  const available = anyField(row, ["PostEmployeeAsAvailableDate", "PostEmployeeAsAvailableText"]);
  const interviewed = anyField(row, ["InterviewNumber", "InterviewNumberID", "InterviewedByDate", "InterviewedBy"]);
  const interviewRating = Number(row.accessFields.InterviewRating || row.accessFields.AverageInterviewRating || row.accessFields.InterviewScore || row.accessFields.InterviewPoints || row.averageInterview || 0);
  const resumeRating = Number(row.accessFields.ResumeRating || row.accessFields.ResumeScore || row.accessFields.ResumePoints || row.accessFields.ResumeGrade || 0);
  const positiveInterview = interviewed && interviewRating > 0 && !assigned;
  const strongResume = resumeRating >= 4 && !interviewed && !assigned;
  const previousAssignment = anyField(row, ["FirstDateOnJob", "LastDayOnJob", "WeeksAway", "CustomerAssignmentHistory", "EmployeeAssignmentHistory"]);
  const workedPreviously = previousAssignment && !assigned;
  const hasContact = Boolean(row.cellPhone || row.accessFields.EmHomePhone || row.email || row.accessFields.EmText || row.accessFields.Text);

  if (choice === "1. Available.") return available;
  if (choice.startsWith("2.")) return workedPreviously;
  if (choice.startsWith("3.")) return positiveInterview;
  if (choice.startsWith("4.")) return strongResume;
  if (choice.startsWith("5.")) return hasContact && !available && !workedPreviously && !positiveInterview && !strongResume;
  if (choice.startsWith("6.")) return (filters.newEntryDays ?? []).some(day => withinDays(row.accessFields.EmEntryDate, Number(day)));
  if (choice.startsWith("7.")) return (filters.newUnassignedDays ?? []).some(day => withinDays(row.accessFields.EmEntryDate, Number(day))) && !assigned && !hasSubTrade(row);
  return true;
}

/** Apply Call Lists 2 selectors and categories to the loaded employee grid. */
export function filterEmployeeSearchCallLists2Rows(rows: EmployeeSummary[], filters: EmployeeSearchCallLists2Filters): EmployeeSummary[] {
  return rows.filter(row => {
    const fields = row.accessFields;
    const cluster = fields.ClusterName || fields.Cluster || fields.ClusterID || "";
    if (filters.cluster && cluster.toLowerCase() !== filters.cluster.toLowerCase()) return false;
    const trade = row.trade || fields.EmTrade || "";
    if (filters.trade && trade.toLowerCase() !== filters.trade.toLowerCase()) return false;
    const qualification = row.qualification || fields.EmQualification || "";
    if (filters.qualification && qualification.toLowerCase() !== filters.qualification.toLowerCase()) return false;
    const lastAction = fields.EmployeeContactHistoryActionType || fields.LastAction || "";
    if (filters.lastAction && lastAction.toLowerCase() !== filters.lastAction.toLowerCase()) return false;
    if (!matchesLastCall(row, filters.lastCall ?? "Any Last Call")) return false;
    const noSubs = filters.noSubs ?? "";
    if (noSubs === "No SUBs" && hasSubTrade(row) || noSubs.startsWith("SUB ") && !truthy(fields[`SubTrade${noSubs.slice(-1)}`]) && !truthy(fields[`SubTrade${noSubs.slice(-1)}ID`])) return false;
    if (!matchAdditional(row, filters)) return false;
    return true;
  });
}

export function callLists2MissingDataNotice(rows: EmployeeSummary[], filters: EmployeeSearchCallLists2Filters): string {
  if (filters.additional?.startsWith("3.") && !rows.some(row => ["InterviewRating", "AverageInterviewRating", "InterviewScore", "InterviewPoints"].some(key => key in row.accessFields))) {
    return "Interview rating fields are not present in the loaded data, so the positive-rating list cannot be built reliably.";
  }
  if (filters.additional?.startsWith("4.") && !rows.some(row => ["ResumeRating", "ResumeScore", "ResumePoints", "ResumeGrade"].some(key => key in row.accessFields))) {
    return "Resume rating fields are not present in the loaded data, so the strong-resume list cannot be built reliably.";
  }
  if ((filters.additional?.startsWith("6.") || filters.additional?.startsWith("7.")) && !rows.some(row => Boolean(row.accessFields.EmEntryDate))) {
    return "Entry dates are not present in the loaded data, so the new-entry date filter cannot be applied.";
  }
  return "";
}
