import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getPayrollCrosscheckRows } from "@/lib/payrollCrosschecks";
import { getPayrollAdjustmentCompanies } from "@/lib/regularPayrollReport";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    const startDate = request.nextUrl.searchParams.get("startDate") ?? "";
    const endDate = request.nextUrl.searchParams.get("endDate") ?? "";
    const payrollCo = (request.nextUrl.searchParams.get("payrollCo") ?? "IPG").toUpperCase();
    const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
    if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) return NextResponse.json({ ok: false, error: "Choose a valid start and end date." }, { status: 400 });
    const companies = await getPayrollAdjustmentCompanies();
    if (payrollCo && !companies.some((company) => company.code.toUpperCase() === payrollCo)) return NextResponse.json({ ok: false, error: "Choose a valid payroll company." }, { status: 400 });
    const rows = await getPayrollCrosscheckRows(startDate, endDate, payrollCo);
    return NextResponse.json({ ok: true, rows, companies });
  } catch (cause) {
    const unauthorized = cause instanceof Error && cause.message === "Unauthorized";
    return NextResponse.json({ ok: false, error: unauthorized ? "Sign-in required." : "Payroll crosscheck data could not be loaded." }, { status: unauthorized ? 401 : 500 });
  }
}
