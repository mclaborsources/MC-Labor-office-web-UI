import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getHealthInsuranceMonthRows } from "@/lib/healthInsuranceMonthReport";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    const yearRaw = request.nextUrl.searchParams.get("year") ?? "";
    if (!/^20\d{2}$/.test(yearRaw)) return NextResponse.json({ ok: false, error: "Choose a valid year." }, { status: 400 });
    const rows = await getHealthInsuranceMonthRows(Number(yearRaw));
    return NextResponse.json({ ok: true, rows });
  } catch (error) {
    const status = error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: status === 401 ? "Sign-in required." : "Health insurance monthly data could not be loaded." }, { status });
  }
}
