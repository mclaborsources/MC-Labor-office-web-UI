import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllAccidentReportRows } from "@/lib/adminDropdownReports";
import { withTransaction } from "@/lib/db/write";
import { clearReadCache } from "@/lib/db/sql";
import { accidentWritableFields, ensureAccidentIsUnique, mapAccidentPayload } from "./[id]/route";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, data: [], error: "Sign in required." }, { status: 403 });
  }
  try {
    const data = await getAllAccidentReportRows();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[api/reports/accidents] Failed to load report rows:", error);
    const detail = error instanceof Error ? error.message : "Unknown database error.";
    return NextResponse.json({ ok: false, data: [], error: `Unable to load accident reports: ${detail}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let session;
  try { session = await requireSession(); }
  catch { return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 403 }); }
  try {
    const fields = mapAccidentPayload(await request.json());
    await ensureAccidentIsUnique(fields);
    if (!fields.ProjectAccidentReportPreparedTimestamp) fields.ProjectAccidentReportPreparedTimestamp = new Date().toISOString();
    if (!fields.ProjectAccidentReportDateReturned && !fields.ProjectAccidentReportFutureCall) { const next=new Date();next.setDate(next.getDate()+7);fields.ProjectAccidentReportFutureCall=next.toISOString().slice(0,10); }
    if (!fields.ProjectAccidentReportAddressOfInjury) fields.ProjectAccidentReportAddressOfInjury = "";
    const entries = Object.entries(fields).filter(([key]) => key in accidentWritableFields);
    const names = entries.map(([key]) => `[${key}]`).join(",");
    const params = entries.map(([name, value]) => ({ name, value }));
    const result = await withTransaction(async run => run(`INSERT INTO tblProjectAccidentReports (${names}) OUTPUT INSERTED.ProjectAccidentReportID AS id VALUES (${entries.map(([key]) => `@${key}`).join(",")})`, params));
    const id = (result.recordset?.[0] as { id?: number } | undefined)?.id;
    if (!id) throw new Error("The database did not create the accident report.");
    clearReadCache();
    return NextResponse.json({ ok: true, id: String(id), user: session.user?.displayName ?? "" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create accident report.";
    return NextResponse.json({ ok: false, error: message }, { status: message.includes("Write operations are disabled") ? 503 : message.includes("required") ? 400 : 500 });
  }
}
