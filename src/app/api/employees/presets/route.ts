import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getPool, queryReadOnlyUncached } from "@/lib/db/sql";
import { ensureEmployeeSearchPresetsTable } from "@/lib/employeeSavedViewsDb";
import { employeeSearchPresetSchema } from "@/lib/employeeSavedViews";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSession();
    const pool = await getPool();
    await ensureEmployeeSearchPresetsTable(pool);
    const rows = await queryReadOnlyUncached<{ slot: number; name: string; layout: string }>(
      "SELECT PresetSlot AS slot, PresetName AS name, LayoutJson AS layout FROM dbo.WebEmployeeSearchPreset ORDER BY PresetSlot",
    );
    const presets = rows.map(row => employeeSearchPresetSchema.parse({ ...row, layout: JSON.parse(row.layout) }));
    return NextResponse.json({ presets }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Sign in to load employee presets." }, { status: 401 });
    }
    const sqlError = error as { number?: number; originalError?: { info?: { number?: number } }; precedingErrors?: Array<{ number?: number }> };
    const number = sqlError?.number ?? sqlError?.originalError?.info?.number ?? sqlError?.precedingErrors?.[0]?.number;
    if (number === 229 || number === 230) return NextResponse.json({ error: "The app’s SQL account needs SELECT, INSERT, UPDATE, ALTER, and CREATE TABLE access to dbo.WebEmployeeSearchPreset." }, { status: 503 });
    console.error("[employee-search-presets]", error);
    return NextResponse.json({ error: "Employee Search presets could not be loaded." }, { status: 503 });
  }
}
