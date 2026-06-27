export type DashboardViewId =
  | "01"
  | "02"
  | "03"
  | "04"
  | "05"
  | "06"
  | "07"
  | "08";

/** Access frmMenu: fraCompanyPolicy option values 1–8 → "View 01" … "View 08". */
export const DASHBOARD_VIEW_IDS: DashboardViewId[] = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
];

const VIEW_IDS = new Set<string>(DASHBOARD_VIEW_IDS);

export function parseDashboardView(raw: string | undefined): DashboardViewId {
  if (raw && VIEW_IDS.has(raw)) {
    return raw as DashboardViewId;
  }
  return "01";
}

export function dashboardViewLabel(id: DashboardViewId): string {
  return `View ${id}`;
}
