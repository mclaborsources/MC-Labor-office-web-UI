import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getOfficeStaffLoginRows } from "@/lib/officeStaffLogins";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    const params = request.nextUrl.searchParams;
    const startDate = params.get("startDate") ?? ""; const endDate = params.get("endDate") ?? "";
    const type = params.get("type") ?? "all"; const staffName = (params.get("staffName") ?? "").trim(); const includeHidden = params.get("includeHidden") === "true";
    if (![startDate,endDate].every(value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) return NextResponse.json({ ok: false, error: "Choose valid start and end dates." }, { status: 400 });
    if (endDate < startDate) return NextResponse.json({ ok: false, error: "End Date must be on or after Start Date." }, { status: 400 });
    const days = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000;
    if (days > 90) return NextResponse.json({ ok: false, error: "Choose a date range of 91 days or less." }, { status: 400 });
    if (!["all","logins","no-logins"].includes(type)) return NextResponse.json({ ok: false, error: "Choose All, Logins, or No Logins." }, { status: 400 });
    const rows = await getOfficeStaffLoginRows(startDate,endDate,staffName,type as "all" | "logins" | "no-logins",includeHidden);
    return NextResponse.json({ ok: true, rows });
  } catch (cause) {
    const unauthorized = cause instanceof Error && cause.message === "Unauthorized";
    return NextResponse.json({ ok: false, error: unauthorized ? "Sign-in required." : "Office staff login records could not be loaded." }, { status: unauthorized ? 401 : 500 });
  }
}
