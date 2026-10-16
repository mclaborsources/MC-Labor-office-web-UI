import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getWeeklyRateRowsForDate } from "@/lib/operationalReports";

export const dynamic = "force-dynamic";

const PAYROLL_COMPANIES = new Set(["", "GS", "HSG", "IPG", "ISG", "MLS", "T&R", "AMP"]);

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });

    const weekEnding = request.nextUrl.searchParams.get("weekEnding") ?? "";
    const payrollCompany = (request.nextUrl.searchParams.get("payrollCompany") ?? "IPG").toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding) || Number.isNaN(Date.parse(`${weekEnding}T00:00:00Z`))) {
      return NextResponse.json({ ok: false, error: "Choose a valid week-ending date." }, { status: 400 });
    }
    if (!PAYROLL_COMPANIES.has(payrollCompany)) {
      return NextResponse.json({ ok: false, error: "Choose a valid payroll company." }, { status: 400 });
    }

    const rows = await getWeeklyRateRowsForDate(weekEnding, payrollCompany);
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: status === 401 ? "Sign-in required." : "Weekly rate records could not be loaded from SQL Server." }, { status });
  }
}
