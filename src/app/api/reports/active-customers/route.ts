import { NextResponse, type NextRequest } from "next/server";
import { getReportCustomers } from "@/lib/reportCustomers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const weekEnding = request.nextUrl.searchParams.get("weekEnding") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekEnding) || Number.isNaN(Date.parse(`${weekEnding}T00:00:00Z`))) {
    return NextResponse.json({ ok: false, error: "Select a valid week ending date." }, { status: 400 });
  }
  try {
    const rows = await getReportCustomers(weekEnding);
    return NextResponse.json({ ok: true, rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Active customer data could not be loaded for that week." }, { status: 500 });
  }
}
