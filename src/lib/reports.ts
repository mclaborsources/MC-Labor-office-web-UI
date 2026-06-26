import { queryReadOnly } from "@/lib/db/sql";

// ---------------------------------------------------------------------------
// Read-only report CATALOG.
//
// This mirrors Access `frmReports`: it lists the report menus and the reports
// inside each menu, straight from `tblPullDownReportMenus` /
// `tblPullDownTrackingReports`. It runs NO report calculations — each report is
// built and validated against Access output one-by-one in Phase B4.
// ---------------------------------------------------------------------------

export interface ReportItem {
  id: string;
  name: string;
  description: string;
}

export interface ReportMenu {
  id: string;
  title: string;
  note: string;
  reports: ReportItem[];
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

const MENUS_SQL = `
SELECT
  PullDownReportMenuID,
  ISNULL(PullDownReportMenu,     '') AS PullDownReportMenu,
  ISNULL(PullDownReportMenuNote, '') AS PullDownReportMenuNote,
  ISNULL(PullDownReportMenuSort, 0)  AS PullDownReportMenuSort
FROM tblPullDownReportMenus WITH (NOLOCK)
WHERE ISNULL(PullDownReportMenuActive, 1) = 1
ORDER BY PullDownReportMenuSort, PullDownReportMenu
`;

const REPORTS_SQL = `
SELECT
  PullDownTrackingReportID,
  ISNULL(PullDownTrackingReportMenuID, 0) AS PullDownTrackingReportMenuID,
  ISNULL(PullDownTrackingReport,     '')  AS PullDownTrackingReport,
  ISNULL(PullDownTrackingReportDesc, '')  AS PullDownTrackingReportDesc,
  ISNULL(PullDownTrackingReportSort, 0)   AS PullDownTrackingReportSort
FROM tblPullDownTrackingReports WITH (NOLOCK)
WHERE ISNULL(PullDownTrackingReportActive, 1) = 1
ORDER BY PullDownTrackingReportSort, PullDownTrackingReport
`;

interface MenuRow {
  PullDownReportMenuID: unknown;
  PullDownReportMenu: string | null;
  PullDownReportMenuNote: string | null;
}

interface ReportRow {
  PullDownTrackingReportID: unknown;
  PullDownTrackingReportMenuID: unknown;
  PullDownTrackingReport: string | null;
  PullDownTrackingReportDesc: string | null;
}

/**
 * Returns the report catalog grouped by menu. Crash-safe: returns an empty list
 * if the lookup tables are unreachable so the page still renders.
 */
export async function getReportCatalog(): Promise<ReportMenu[]> {
  let menuRows: MenuRow[] = [];
  let reportRows: ReportRow[] = [];
  try {
    [menuRows, reportRows] = await Promise.all([
      queryReadOnly<MenuRow>(MENUS_SQL),
      queryReadOnly<ReportRow>(REPORTS_SQL),
    ]);
  } catch {
    return [];
  }

  const byMenu = new Map<string, ReportItem[]>();
  for (const r of reportRows) {
    const menuId = String(r.PullDownTrackingReportMenuID ?? "");
    if (!byMenu.has(menuId)) byMenu.set(menuId, []);
    byMenu.get(menuId)!.push({
      id: safeStr(r.PullDownTrackingReportID),
      name: safeStr(r.PullDownTrackingReport) || "(unnamed report)",
      description: safeStr(r.PullDownTrackingReportDesc),
    });
  }

  return menuRows.map((m) => {
    const id = safeStr(m.PullDownReportMenuID);
    return {
      id,
      title: safeStr(m.PullDownReportMenu) || "Reports",
      note: safeStr(m.PullDownReportMenuNote),
      reports: byMenu.get(id) ?? [],
    };
  });
}
