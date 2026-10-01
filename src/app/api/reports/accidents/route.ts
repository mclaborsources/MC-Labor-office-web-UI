import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllAccidentReportRows } from "@/lib/adminDropdownReports";

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
    return NextResponse.json({ ok: false, data: [], error: "Unable to load accident reports." }, { status: 500 });
  }
}
