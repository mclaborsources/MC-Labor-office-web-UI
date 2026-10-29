import type { EmployeeSummary } from "@/types/employee";

export type EmployeeSearchViews4Filters = Partial<Record<
  "profile" | "timeFor" | "timeDuration" | "trade" | "state" | "county" | "ipgStatus" | "settingField" | "settingValue",
  string
>>;

function dateValue(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isFinite(date.getTime())) return date;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  return match ? new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2])) : null;
}

function matchesDuration(value: string, duration: string): boolean {
  if (!duration || duration === "All") return true;
  const date = dateValue(value);
  if (!date) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday); nextMonday.setDate(nextMonday.getDate() + 7);
  const previousMonday = new Date(monday); previousMonday.setDate(previousMonday.getDate() - 7);
  const daysOld = (today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86_400_000;
  if (duration === "Current Wk") return date >= monday && date < nextMonday;
  if (duration === "Last Wk") return date >= previousMonday && date < monday;
  if (duration === "Exclude Current Wk") return date < monday;
  const ranges: Record<string, [number, number]> = {
    ">1 - 4 Wks": [7, 28], ">4 - 8 Wks": [28, 56], ">8 - 12 Wks": [56, 84],
    ">12 - 24 Wks": [84, 168], ">24 - 36 Wks": [168, 252], ">36 - 52 Wks": [252, 365],
    ">1 - 2 Yrs": [365, 730], ">2 - 3 Yrs": [730, 1095], ">3 - 4 Yrs": [1095, 1460],
    ">4 - 5 Yrs": [1460, 1825], ">5 Yrs": [1825, Number.POSITIVE_INFINITY],
  };
  const range = ranges[duration];
  return !range || (daysOld >= range[0] && daysOld < range[1]);
}

function valueForSetting(row: EmployeeSummary, field: string): string {
  const values: Record<string, string> = {
    "Profile Type": row.profileType || row.accessFields.EmployeeProfileType || "",
    "EE Status": row.status || row.accessFields.EmEmployeeStatus || "",
    Trade: row.trade || row.accessFields.EmTrade || "",
    State: row.state || row.accessFields.EmState || "",
    County: row.accessFields.CountyFilter || row.accessFields.County || "",
    Grade: row.grade || row.accessFields.GradeName || "",
    Recruiter: row.accessFields.EmEntryUserName || row.accessFields.EmployeeContactHistoryUserName || "",
    "Last Action": row.accessFields.EmployeeContactHistoryActionType || "",
  };
  return values[field] ?? "";
}

function matchesTrade(value: string, choice: string): boolean {
  if (!choice || choice === "All") return true;
  const trade = value.toLocaleLowerCase();
  if (choice.startsWith("[Elec")) return /electric|\belec\b/.test(trade);
  if (choice.startsWith("[Plumb")) return /plumb/.test(trade);
  if (choice.startsWith("[HVAC")) return /hvac|sheet metal/.test(trade);
  return trade === choice.toLocaleLowerCase() || trade.includes(choice.toLocaleLowerCase());
}

/** Apply the Access Views 4 radio and user-setting filters to currently loaded employees. */
export function filterEmployeeSearchViews4Rows(
  rows: EmployeeSummary[],
  filters: EmployeeSearchViews4Filters,
): EmployeeSummary[] {
  const dateFields: Record<string, string> = {
    "Last Week Ending w/ Assignment": "WeekEndingDate",
    "Last Action": "EmployeeContactHistoryDate",
    "Last Call": "LastCallDate",
    "Future Call": "EmployeeFutureCall",
    Interviewed: "InterviewedByDate",
    "Entry Date": "EmEntryDate",
  };
  const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/ county$/, "");
  const timeField = filters.timeFor ? dateFields[filters.timeFor] : undefined;
  return rows.filter(row => {
    const profile = filters.profile ?? "";
    const assigned = Boolean(row.currentAssignment || row.accessFields.CustomerBusName || row.accessFields.SiteName || row.weekEnding);
    if (profile === "Has Assign" && !assigned || profile === "No Assign" && assigned) return false;
    if (profile.startsWith("[ EE Search 3") && !/employee|main/i.test(row.profileType || row.accessFields.EmployeeProfileType || "")) return false;
    if (profile && profile !== "All" && !profile.startsWith("[ EE Search 3") && profile !== "Has Assign" && profile !== "No Assign"
      && normalize(row.profileType || row.accessFields.EmployeeProfileType || "") !== normalize(profile)) return false;
    const timeValue = timeField === "WeekEndingDate" ? row.weekEnding || row.accessFields.WeekEndingDate || "" : timeField ? row.accessFields[timeField] || "" : "";
    if (timeField && !matchesDuration(timeValue, filters.timeDuration ?? "")) return false;
    if (!matchesTrade(row.trade || row.accessFields.EmTrade || "", filters.trade ?? "")) return false;
    if (filters.state && filters.state !== "All" && normalize(row.state || row.accessFields.EmState || "") !== normalize(filters.state)) return false;
    const county = row.accessFields.CountyFilter || row.accessFields.County || "";
    if (filters.county && filters.county !== "All" && normalize(county) !== normalize(filters.county)) return false;
    if (filters.ipgStatus && filters.ipgStatus !== "All"
      && normalize(row.accessFields.JobApplicationStatus_IPG || "") !== normalize(filters.ipgStatus)) return false;
    if (filters.settingField && filters.settingValue && filters.settingValue !== "All") {
      const value = valueForSetting(row, filters.settingField);
      const setting = filters.settingValue;
      const normalizedValue = normalize(value);
      const isTruthy = Boolean(value) && !["no", "false", "0", "n"].includes(normalizedValue);
      if (setting === "Yes" && !isTruthy || setting === "No" && isTruthy
        || setting === "Not Blank" && !value
        || (setting === "Main" || setting === "Sub") && normalize(value) !== normalize(setting)
        || (setting === "Active" || setting === "Inactive") && normalize(value) !== normalize(setting)
        || !["Yes", "No", "Not Blank", "Main", "Sub", "Active", "Inactive"].includes(setting)
          && normalize(value) !== normalize(setting)) return false;
    }
    return true;
  });
}
