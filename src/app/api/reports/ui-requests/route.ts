import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllUnemploymentRequestContactRows, getAllUnemploymentRequestRows } from "@/lib/adminDropdownReports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, data: [], contacts: [], error: "Sign in required." }, { status: 403 });
  }
  try {
    const [data, contacts] = await Promise.all([
      getAllUnemploymentRequestRows(),
      getAllUnemploymentRequestContactRows(),
    ]);
    return NextResponse.json({ ok: true, data, contacts });
  } catch (error) {
    console.error("[api/reports/ui-requests] Failed to load report rows:", error);
    return NextResponse.json({ ok: false, data: [], error: "Unable to load unemployment requests." }, { status: 500 });
  }
}
