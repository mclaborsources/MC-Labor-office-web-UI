import { queryReadOnly } from "@/lib/db/sql";

// ---------------------------------------------------------------------------
// Read-only admin / connection status.
//
// Surfaces SQL connection health and the Access permission model
// (tblOfficeStaff + tblOfficeStaffPermission + tblFeature) for reference only.
// No passwords are ever selected, and nothing here writes to the database.
// ---------------------------------------------------------------------------

export interface ConnectionStatus {
  ok: boolean;
  database: string;
  server: string;
  version: string;
  serverTime: string;
  error?: string;
}

export interface OfficeStaffPermissionSummary {
  staffId: string;
  name: string;
  initials: string;
  title: string;
  active: boolean;
  featureGrants: number;
}

export interface PermissionOverview {
  staff: OfficeStaffPermissionSummary[];
  activeStaff: number;
  totalFeatures: number;
  activeFeatures: number;
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  try {
    const rows = await queryReadOnly<{
      db: string | null;
      server: string | null;
      version: string | null;
      now: string | Date | null;
    }>(
      `SELECT DB_NAME() AS db, CAST(SERVERPROPERTY('ServerName') AS NVARCHAR(256)) AS server,
              CAST(SERVERPROPERTY('ProductVersion') AS NVARCHAR(64)) AS version,
              CONVERT(VARCHAR(19), GETDATE(), 120) AS now`,
    );
    const r = rows[0];
    if (!r) return { ok: false, database: "", server: "", version: "", serverTime: "", error: "No status returned." };
    return {
      ok: true,
      database: safeStr(r.db),
      server: safeStr(r.server),
      version: safeStr(r.version),
      serverTime: safeStr(r.now),
    };
  } catch (err) {
    return {
      ok: false,
      database: "",
      server: "",
      version: "",
      serverTime: "",
      error: err instanceof Error ? err.message : "Database connection failed.",
    };
  }
}

export async function getPermissionOverview(): Promise<PermissionOverview> {
  try {
    const [staffRows, featureRows] = await Promise.all([
      queryReadOnly<{
        OfficeStaffID: unknown;
        Name: string | null;
        Initials: string | null;
        OfficeStaffTitle: string | null;
        OfficeStaffActive: boolean | number | null;
        FeatureGrants: number | null;
      }>(
        `SELECT
           s.OfficeStaffID,
           LTRIM(RTRIM(ISNULL(s.OfficeStaffFullName, ISNULL(s.OfficeStaffFirstName, '') + ' ' + ISNULL(s.OfficeStaffLastName, '')))) AS Name,
           ISNULL(s.Initials, '')        AS Initials,
           ISNULL(s.OfficeStaffTitle, '') AS OfficeStaffTitle,
           ISNULL(s.OfficeStaffActive, 0) AS OfficeStaffActive,
           (SELECT COUNT(*) FROM tblOfficeStaffPermission p WITH (NOLOCK) WHERE p.OfficeStaffID = s.OfficeStaffID) AS FeatureGrants
         FROM tblOfficeStaff s WITH (NOLOCK)
         ORDER BY s.OfficeStaffActive DESC, Name`,
      ),
      queryReadOnly<{ TotalFeatures: number | null; ActiveFeatures: number | null }>(
        `SELECT COUNT(*) AS TotalFeatures,
                SUM(CASE WHEN ISNULL(FeatureActive, 0) = 1 THEN 1 ELSE 0 END) AS ActiveFeatures
         FROM tblFeature WITH (NOLOCK)`,
      ),
    ]);

    const staff: OfficeStaffPermissionSummary[] = staffRows.map((r) => ({
      staffId: safeStr(r.OfficeStaffID),
      name: safeStr(r.Name) || "—",
      initials: safeStr(r.Initials),
      title: safeStr(r.OfficeStaffTitle),
      active: r.OfficeStaffActive === true || r.OfficeStaffActive === 1,
      featureGrants: Number(r.FeatureGrants ?? 0),
    }));

    const feat = featureRows[0];
    return {
      staff,
      activeStaff: staff.filter((s) => s.active).length,
      totalFeatures: Number(feat?.TotalFeatures ?? 0),
      activeFeatures: Number(feat?.ActiveFeatures ?? 0),
    };
  } catch {
    return { staff: [], activeStaff: 0, totalFeatures: 0, activeFeatures: 0 };
  }
}
