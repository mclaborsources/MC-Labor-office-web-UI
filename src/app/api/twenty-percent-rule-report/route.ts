import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getTwentyPercentRuleRows } from "@/lib/salesReportBreakdown";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
    const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
    const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
    if (!valid(startDate) || !valid(endDate) || startDate > endDate) return NextResponse.json({ ok: false, error: "Choose a valid report date range." }, { status: 400 });
    return NextResponse.json({ ok: true, rows: await getTwentyPercentRuleRows(startDate, endDate) });
  } catch (cause) {
    const unauthorized = cause instanceof Error && cause.message === "Unauthorized";
    return NextResponse.json({ ok: false, error: unauthorized ? "Sign-in required." : "20% Rule Report data could not be loaded." }, { status: unauthorized ? 401 : 500 });
  }
}
