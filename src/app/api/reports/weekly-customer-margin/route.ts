import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getDatabaseSettings } from "@/lib/config/database";
import { getMarginByWeekRows } from "@/lib/operationalReports";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    if (!getDatabaseSettings()) return NextResponse.json({ ok: false, error: "The SQL Server connection is not configured." }, { status: 503 });
    const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
    const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
    const validDate = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (!validDate(startDate) || !validDate(endDate)) return NextResponse.json({ ok: false, error: "Enter valid report dates." }, { status: 400 });
    if (startDate && endDate && startDate > endDate) return NextResponse.json({ ok: false, error: "Start date must be on or before end date." }, { status: 400 });
    const rows = await getMarginByWeekRows(startDate, endDate);
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: status === 401 ? "Sign-in required." : "Customer margin data could not be loaded from SQL Server." }, { status });
  }
}
