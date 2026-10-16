import { NextResponse } from "next/server";
import { clearReadCache } from "@/lib/db/sql";
import { getOpenInvoiceRows } from "@/lib/operationalReports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    clearReadCache();
    const rows = await getOpenInvoiceRows();
    return NextResponse.json({ ok: true, rows, refreshedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Open invoices could not be refreshed from the office database." }, { status: 500 });
  }
}
