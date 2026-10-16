import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { queryReadOnly } from "@/lib/db/sql";

export const dynamic = "force-dynamic";

interface WccReportRow {
  WCC: string | null;
  Description: string | null;
  State: string | null;
  TrackingWccRate: number | string | null;
}

export async function GET() {
  try {
    await requireSession();
    const rows = await queryReadOnly<WccReportRow>(`SELECT
      ISNULL(w.PullDownWCC, LTRIM(RTRIM(t.WCC))) AS WCC,
      ISNULL(w.PullDownWCCDesc, '') AS Description,
      ISNULL(t.SiteState, '') AS State,
      MAX(ISNULL(t.WccTracking,0)) AS TrackingWccRate
      FROM tblTracking t WITH (NOLOCK)
      LEFT JOIN tblPullDownWCC w WITH (NOLOCK)
        ON LTRIM(RTRIM(w.PullDownWCC))=LTRIM(RTRIM(t.WCC))
      WHERE NULLIF(LTRIM(RTRIM(ISNULL(t.WCC,''))),'') IS NOT NULL
      GROUP BY ISNULL(w.PullDownWCC, LTRIM(RTRIM(t.WCC))),w.PullDownWCCDesc,t.SiteState
      ORDER BY WCC,t.SiteState`);
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the WCC rates report.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("sign-in") ? 401 : 500 });
  }
}
