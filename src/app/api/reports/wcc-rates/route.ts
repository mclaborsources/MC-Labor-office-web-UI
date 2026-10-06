import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";

export const dynamic = "force-dynamic";
type Column = { TABLE_SCHEMA: string; TABLE_NAME: string; COLUMN_NAME: string };
type DataRow = Record<string, unknown>;
const normalized = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.user?.roles.includes("admin")) return NextResponse.json({ ok: false, error: "Administrator sign-in required." }, { status: 403 });
    const columns = await queryReadOnly<Column>(`SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME LIKE '%WCC%' OR COLUMN_NAME LIKE '%WCC%'`);
    const groups = new Map<string, Column[]>();
    for (const column of columns) {
      const key = `${column.TABLE_SCHEMA}.${column.TABLE_NAME}`;
      groups.set(key, [...(groups.get(key) ?? []), column]);
    }
    const candidates = [...groups.entries()].map(([name, fields]) => {
      const table = fields[0]?.TABLE_NAME ?? "";
      const names = fields.map(field => normalized(field.COLUMN_NAME));
      const score = (table.toLowerCase().includes("rate") ? 100 : 0)
        + (table.toLowerCase().includes("wcc") ? 50 : 0)
        + (names.some(field => field === "wcc" || field.endsWith("wcccode")) ? 20 : 0)
        + (names.some(field => field.includes("desc")) ? 10 : 0)
        + (names.some(field => field.includes("state")) ? 5 : 0);
      return { name, fields, score };
    }).filter(candidate => candidate.fields[0]?.TABLE_NAME.toLowerCase().includes("wcc") && candidate.fields.some(field => normalized(field.COLUMN_NAME).includes("wcc")))
      .sort((a, b) => b.score - a.score);
    if (candidates[0]) {
      const selected = candidates[0];
      const schema = selected.fields[0]?.TABLE_SCHEMA ?? "dbo";
      const table = selected.fields[0]?.TABLE_NAME ?? "";
      const rows = await queryReadOnly<DataRow>(`SELECT TOP (2000) * FROM [${schema.replaceAll("]", "]]" )}].[${table.replaceAll("]", "]]" )}]`);
      return NextResponse.json({ ok: true, sourceTable: selected.name, columns: selected.fields.map(field => field.COLUMN_NAME), rows, limited: rows.length === 2000 });
    }
    const rows = await queryReadOnly<DataRow>(`SELECT TOP (2000) ISNULL(WCC,'') AS WCC, ISNULL(SiteState,'') AS State, ISNULL(PayrollCoOnSiteInitials,'') AS [Contract With], MAX(ISNULL(WccTracking,0)) AS [Tracking WCC Rate], CAST(COUNT_BIG(*) AS INT) AS [Tracking Rows] FROM tblTracking WITH (NOLOCK) WHERE NULLIF(LTRIM(RTRIM(ISNULL(WCC,''))),'') IS NOT NULL GROUP BY WCC,SiteState,PayrollCoOnSiteInitials ORDER BY WCC,SiteState,PayrollCoOnSiteInitials`);
    return NextResponse.json({ ok: true, sourceTable: "tblTracking (WCC usage fallback)", columns: ["WCC", "State", "Contract With", "Tracking WCC Rate", "Tracking Rows"], rows, limited: rows.length === 2000, rateMasterFound: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load WCC rates.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Administrator") ? 403 : 500 });
  }
}
