import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getDatabaseSettings } from "@/lib/config/database";
import { getEmployeeAdvanceReportRows } from "@/lib/employeeAdvanceReport";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    if (!getDatabaseSettings()) {
      return NextResponse.json({
        ok: false,
        error: "The SQL Server connection is not configured. An administrator needs to configure it in Setup before this report can load records.",
      }, { status: 503 });
    }
    const rows = await getEmployeeAdvanceReportRows();
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: status === 401 ? "Sign-in required." : "Employee advance data could not be loaded." }, { status });
  }
}
