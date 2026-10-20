/** Payroll-co badge colors (Access PayrollCoOnSiteColorID + initials). */
export const PAYROLL_CO_COLORS: Record<string, string> = {
  IPG: "#e8913a",
  ISG: "#1e4a8a",
  MLS: "#2a6f9e",
  HSG: "#3d8b5a",
  HDE: "#1a5c5c",
  GS: "#6b4c9a",
};

/** Sat–Fri status flag background (Access SatStatusFlagID etc.). */
export const DAY_FLAG_BG: Record<string, string> = {
  "2": "#4daec2",
  "7": "#4daec2",
  "9": "#4daec2",
  "3": "#f4c20d",
  "4": "#e8553e",
};

/** HLink timesheet CV color names from tblTracking.HLinkTimesheetColorCV. */
export const HL_CV_COLORS: Record<string, string> = {
  Yellow: "#ffff66",
  Green: "#5dff5d",
  Orange: "#ffb84f",
  Purple: "#d4b6e8",
  Blue: "#53b9ff",
  Red: "#f68a8f",
};

/** Access OLE colors from frmTrackingEditHolding's conditional formatting. */
export const PAYROLL_COLOR_IDS: Record<number, string> = {
  11: "#ffa500", 2: "#800080", 1: "#ff00ff", 3: "#0000ff",
  13: "#800000", 8: "#008000", 6: "#008080", 4: "#000080", 12: "#ff0000",
};

export function trackingGradeColor(grade: string): string | undefined {
  const initial = grade.trim().toUpperCase().charAt(0);
  return initial === "A" ? "#ff0000" : initial === "B" ? "#0000ff" : undefined;
}

export function trackingDayColor(flag: string, dayIndex: number): string {
  if (flag === "5") return "#ed1c24";
  if (["2", "7", "9"].includes(flag)) return "#f9cdaa";
  if (flag === "8") return "#ffc20e";
  return dayIndex === 1 ? "#fff200" : "#4bacc6";
}
