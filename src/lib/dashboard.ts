import { queryReadOnly } from "@/lib/db/sql";
import { PDF_MAP_RELATIVE_PATH } from "@/lib/dashboardConstants";
import type { DashboardViewId } from "@/lib/dashboardViews";

export interface CompanyPolicyRow {
  companyPolicyId: number;
  companyPolicy: string;
  companyPolicyText: string;
}

export interface DashboardMapOption {
  pullDownMapId: number;
  pullDownMap: string;
  pullDownMapHLink: string;
  pullDownMapSort: number;
}

export interface DashboardSettings {
  rootFolder: string;
  companyHistoryNotes: string;
  companyApplicationTitle: string;
  companyLogoPath: string;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export function viewPolicyName(viewId: DashboardViewId): string {
  return `View ${viewId}`;
}

export async function getDashboardSettings(): Promise<DashboardSettings> {
  try {
    const rows = await queryReadOnly<{
      RootFolder: string | null;
      CompanyHistoryNotes: string | null;
      CompanyApplicationTitle: string | null;
      CompanyLogoPath: string | null;
    }>(
      `SELECT TOP (1)
         RootFolder,
         CompanyHistoryNotes,
         CompanyApplicationTitle,
         CompanyLogoPath
       FROM SettingsBE WITH (NOLOCK)`,
    );
    const r = rows[0];
    return {
      rootFolder: str(r?.RootFolder),
      companyHistoryNotes: str(r?.CompanyHistoryNotes),
      companyApplicationTitle: str(r?.CompanyApplicationTitle) || "Mc Labor Sources",
      companyLogoPath: str(r?.CompanyLogoPath),
    };
  } catch {
    return {
      rootFolder: "",
      companyHistoryNotes: "",
      companyApplicationTitle: "Mc Labor Sources",
      companyLogoPath: "",
    };
  }
}

export async function getCompanyPolicies(): Promise<CompanyPolicyRow[]> {
  try {
    const rows = await queryReadOnly<{
      CompanyPolicyID: number;
      CompanyPolicy: string;
      CompanyPolicyText: string | null;
    }>(
      `SELECT CompanyPolicyID, CompanyPolicy, CompanyPolicyText
       FROM tblCompanyPolicies WITH (NOLOCK)
       ORDER BY CompanyPolicy`,
    );
    return rows.map((r) => ({
      companyPolicyId: Number(r.CompanyPolicyID),
      companyPolicy: str(r.CompanyPolicy),
      companyPolicyText: str(r.CompanyPolicyText),
    }));
  } catch {
    return [];
  }
}

export async function getCompanyPolicyForView(
  viewId: DashboardViewId,
): Promise<CompanyPolicyRow | null> {
  const name = viewPolicyName(viewId);
  try {
    const rows = await queryReadOnly<{
      CompanyPolicyID: number;
      CompanyPolicy: string;
      CompanyPolicyText: string | null;
    }>(
      `SELECT TOP (1) CompanyPolicyID, CompanyPolicy, CompanyPolicyText
       FROM tblCompanyPolicies WITH (NOLOCK)
       WHERE CompanyPolicy = @name`,
      [{ name: "name", value: name }],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      companyPolicyId: Number(r.CompanyPolicyID),
      companyPolicy: str(r.CompanyPolicy),
      companyPolicyText: str(r.CompanyPolicyText),
    };
  } catch {
    return null;
  }
}

export async function getActiveMaps(): Promise<DashboardMapOption[]> {
  try {
    const rows = await queryReadOnly<{
      PullDownMapID: number;
      PullDownMap: string;
      PullDownMapHLink: string | null;
      PullDownMapSort: number | null;
    }>(
      `SELECT PullDownMapID, PullDownMap, PullDownMapHLink, PullDownMapSort
       FROM tblPullDownMaps WITH (NOLOCK)
       WHERE PullDownMapActive = 1
       ORDER BY PullDownMapSort, PullDownMap`,
    );
    return rows.map((r) => ({
      pullDownMapId: Number(r.PullDownMapID),
      pullDownMap: str(r.PullDownMap),
      pullDownMapHLink: str(r.PullDownMapHLink),
      pullDownMapSort: Number(r.PullDownMapSort ?? 0),
    }));
  } catch {
    return [];
  }
}

export function resolveMapUrl(
  map: DashboardMapOption,
  rootFolder: string,
): string | null {
  const link = map.pullDownMapHLink;
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return link;
  const cleaned = link.replace(/^<00 Maps>\\?/i, "").replace(/\\/g, "/");
  if (!rootFolder) return null;
  const base = rootFolder.replace(/\\/g, "/").replace(/\/$/, "");
  return `${base}/00 Maps/${cleaned}`;
}

export function resolvePdfMapPath(rootFolder: string): string | null {
  if (!rootFolder) return null;
  const base = rootFolder.replace(/\\/g, "\\").replace(/\\$/, "");
  return `${base}\\${PDF_MAP_RELATIVE_PATH}`;
}
