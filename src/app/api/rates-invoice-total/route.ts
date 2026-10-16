import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getRatesInvoiceTotalRows } from "@/lib/ratesInvoiceTotal";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.user?.active) return NextResponse.json({ ok: false, error: "Sign-in required." }, { status: 401 });
    const weekEnding = request.nextUrl.searchParams.get("weekEnding") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding) || Number.isNaN(Date.parse(`${weekEnding}T00:00:00Z`))) {
      return NextResponse.json({ ok: false, error: "Choose a valid week-ending date." }, { status: 400 });
    }
    const rows = await getRatesInvoiceTotalRows(weekEnding);
    return NextResponse.json({ ok: true, rows });
  } catch (cause) {
    const unauthorized = cause instanceof Error && cause.message === "Unauthorized";
    return NextResponse.json({ ok: false, error: unauthorized ? "Sign-in required." : "Rates and invoice data could not be loaded." }, { status: unauthorized ? 401 : 500 });
  }
}
