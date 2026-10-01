import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getEmployeeWorkHistoryRows } from "@/lib/adminDropdownReports";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, data: [], error: "Sign in required." }, { status: 403 });
  }
  const params = request.nextUrl.searchParams;
  const employeeId = Number(params.get("employeeId"));
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  if (!Number.isInteger(employeeId) || employeeId <= 0 || !validDate(startDate) || !validDate(endDate) || startDate > endDate) {
    return NextResponse.json({ ok: false, data: [], error: "Choose an employee and a valid work-history date range." }, { status: 400 });
  }
  try {
    const data = await getEmployeeWorkHistoryRows(employeeId, startDate, endDate);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[api/reports/ui-requests/employee-history] Failed to load history:", error);
    const detail = error instanceof Error ? error.message : "Unknown database error.";
    return NextResponse.json({ ok: false, data: [], error: `Unable to load employee work history: ${detail}` }, { status: 500 });
  }
}
