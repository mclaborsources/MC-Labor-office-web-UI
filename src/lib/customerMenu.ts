import { queryReadOnly } from "@/lib/db/sql";
import { getLatestTrackingWeek } from "@/lib/trackingWeek";

export interface CustomerMenuTile {
  customerId: string;
  label: string;
  entityCode: string;
  entityColor: string;
  rowCount: number;
  /** Optional Access customer tile background (when wired from SQL). */
  tileColor?: string;
}

export interface CustomerMenuResult {
  tiles: CustomerMenuTile[];
  assignWeek: number;
  assignYear: number;
  fallback?: boolean;
  requestedWeek?: number;
  requestedYear?: number;
}

const ENTITY_COLORS: Record<string, string> = {
  IPG: "#e8913a",
  ISG: "#1e4a8a",
  MLS: "#2a6f9e",
  HSG: "#3d8b5a",
  HDE: "#1a5c5c",
  GS: "#6b4c9a",
};

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export async function getCustomerMenuTiles(
  week: number,
  year: number,
): Promise<CustomerMenuTile[]> {
  try {
    const rows = await queryReadOnly<{
      CustomerID: number;
      CustomerBusName: string;
      PayrollCoOnSiteInitials: string | null;
      AssignmentCount: number;
    }>(
      `SELECT CustomerID,
              MAX(CustomerBusName) AS CustomerBusName,
              MAX(PayrollCoOnSiteInitials) AS PayrollCoOnSiteInitials,
              COUNT(*) AS AssignmentCount
       FROM tblTracking WITH (NOLOCK)
       WHERE AssignWeek = @week AND AssignYear = @year
         AND CustomerID IS NOT NULL
       GROUP BY CustomerID
       ORDER BY MAX(CustomerBusName)`,
      [
        { name: "week", value: week },
        { name: "year", value: year },
      ],
    );

    return rows.map(mapTile);
  } catch {
    return [];
  }
}

function mapTile(r: {
  CustomerID: number;
  CustomerBusName: string;
  PayrollCoOnSiteInitials: string | null;
  AssignmentCount: number;
}): CustomerMenuTile {
  const code = str(r.PayrollCoOnSiteInitials) || "IPG";
  return {
    customerId: str(r.CustomerID),
    label: str(r.CustomerBusName) || `Customer #${r.CustomerID}`,
    entityCode: code.slice(0, 3).toUpperCase(),
    entityColor: ENTITY_COLORS[code.slice(0, 3).toUpperCase()] ?? "#888",
    rowCount: r.AssignmentCount ?? 0,
  };
}

/** Load customer tiles for the resolved week; fall back to latest week with tracking data. */
export async function getCustomerMenuWithFallback(
  week: number,
  year: number,
): Promise<CustomerMenuResult> {
  const requestedWeek = week;
  const requestedYear = year;

  let tiles = await getCustomerMenuTiles(week, year);
  if (tiles.length > 0) {
    return { tiles, assignWeek: week, assignYear: year };
  }

  const latest = await getLatestTrackingWeek();
  if (
    latest &&
    (latest.assignWeek !== week || latest.assignYear !== year)
  ) {
    tiles = await getCustomerMenuTiles(latest.assignWeek, latest.assignYear);
    if (tiles.length > 0) {
      return {
        tiles,
        assignWeek: latest.assignWeek,
        assignYear: latest.assignYear,
        fallback: true,
        requestedWeek,
        requestedYear,
      };
    }
  }

  return { tiles: [], assignWeek: week, assignYear: year };
}

export function countByEntity(tiles: CustomerMenuTile[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of tiles) {
    counts[t.entityCode] = (counts[t.entityCode] ?? 0) + 1;
  }
  return counts;
}
