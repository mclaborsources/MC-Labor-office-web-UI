import type { EmployeeSummary } from "@/types/employee";

export type EmployeeSearchViews3Filters = Partial<Record<"timeFrame" | "trade" | "state" | "county" | "preset", string>>;

function parseEmployeeDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isFinite(parsed.getTime())) return parsed;
  const usDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!usDate) return null;
  return new Date(Number(usDate[3]), Number(usDate[1]) - 1, Number(usDate[2]));
}

function dateMatchesTimeFrame(value: string, timeFrame: string): boolean {
  if (!timeFrame || timeFrame === "All") return true;
  const date = parseEmployeeDate(value);
  if (!date) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = 86_400_000;
  const thisMonday = new Date(startOfToday);
  thisMonday.setDate(thisMonday.getDate() - ((thisMonday.getDay() + 6) % 7));
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const previousMonday = new Date(thisMonday);
  previousMonday.setDate(previousMonday.getDate() - 7);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  const nextYear = new Date(now.getFullYear() + 1, 0, 1);
  switch (timeFrame) {
    case "Today": return startOfDate.getTime() === startOfToday.getTime();
    case "Yesterday": return startOfDate.getTime() === startOfToday.getTime() - day;
    case "This Week": return date >= thisMonday && date < nextMonday;
    case "Last Week": return date >= previousMonday && date < thisMonday;
    case "This Month": return date >= thisMonth && date < nextMonth;
    case "Last Month": return date >= previousMonth && date < thisMonth;
    case "Year-to-Date": return date >= thisYear && date < nextYear && date <= startOfToday;
    case "Last Year": return date >= new Date(now.getFullYear() - 1, 0, 1) && date < thisYear;
    default: return true;
  }
}

function matchesTrade(value: string, trade: string): boolean {
  const normalized = value.trim().toLocaleLowerCase();
  const choice = trade.trim().toLocaleLowerCase();
  if (!choice || choice === "all") return true;
  if (choice.startsWith("[ elec")) return /electric|\belec\b/.test(normalized);
  if (choice.startsWith("[ plumb")) return /plumb/.test(normalized);
  if (choice.startsWith("[ hvac")) return /hvac|sheet metal/.test(normalized);
  if (choice === "lic") return /journeyman|licensed|\blic\b/.test(normalized);
  if (choice === "app ]") return /apprentice|\bapp\b/.test(normalized);
  return normalized === choice || normalized.includes(choice);
}

/** Apply the Employee Search Views 3 radio criteria to the current loaded rows. */
export function filterEmployeeSearchViews3Rows(
  rows: EmployeeSummary[],
  filters: EmployeeSearchViews3Filters,
): EmployeeSummary[] {
  const timeFrame = filters.timeFrame ?? "";
  const trade = filters.trade ?? "";
  const state = filters.state ?? "";
  const county = filters.county ?? "";
  const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/ county$/, "");
  return rows.filter(row => {
    if (!dateMatchesTimeFrame(row.weekEnding || row.accessFields.WeekEndingDate || "", timeFrame)) return false;
    if (!matchesTrade(row.trade || row.accessFields.EmTrade || "", trade)) return false;
    if (state && state !== "All" && row.state.trim().toLocaleLowerCase() !== state.trim().toLocaleLowerCase()) return false;
    const rowCounty = row.accessFields.CountyFilter ?? row.accessFields.County ?? "";
    if (county && county !== "All" && normalize(rowCounty) !== normalize(county)) return false;
    const fields = row.accessFields;
    const hasAny = (...keys: string[]) => keys.some(key => {
      const value = fields[key]?.trim();
      return Boolean(value) && !["0", "false", "no", "n"].includes(value!.toLowerCase());
    });
    const preset = filters.preset ?? "";
    if (preset === "New Apps" && !hasAny("JobApplicationStatus_IPG", "OnlineJobAppFolder")) return false;
    if (preset === "Remote" && !hasAny("WillTravel", "EmployeeWillTravel", "Remote")) return false;
    if (preset === "Interview #" && !hasAny("InterviewNumber", "InterviewNumberID")) return false;
    if (preset === "Last Action" && !hasAny("EmployeeContactHistoryActionType", "EmployeeContactHistoryDate", "LastAction")) return false;
    if (preset === "Call History" && !hasAny("CallNumber", "CallDate", "LastCallDate", "CallNote", "CallHistory")) return false;
    if (preset === "Resume #" && !hasAny("ResumeNumber", "ResumeNumberID")) return false;
    if (preset === "1st Call #" && !hasAny("FirstCallNumber", "FirstCallDate")) return false;
    if (preset === "Interview Date" && !hasAny("InterviewDate", "InterviewByDate", "InterviewedByDate")) return false;
    if (preset === "Main Points" && !hasAny("MainPoints", "EmployeeNotes")) return false;
    return true;
  });
}
