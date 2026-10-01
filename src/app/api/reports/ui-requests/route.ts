import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getAllUnemploymentRequestContactRows, getAllUnemploymentRequestRows, getUnemploymentContactFaxColumn, getUnemploymentContactStates, getUnemploymentRequestDropdownRows } from "@/lib/adminDropdownReports";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ ok: false, data: [], contacts: [], error: "Sign in required." }, { status: 403 });
  }
  try {
    const data = await getAllUnemploymentRequestRows();
    let contacts: Awaited<ReturnType<typeof getAllUnemploymentRequestContactRows>> = [];
    let contactsError = "";
    try {
      contacts = await getAllUnemploymentRequestContactRows();
    } catch (error) {
      contactsError = error instanceof Error ? error.message : "Contact list query failed.";
      console.error("[api/reports/ui-requests] Failed to load contacts:", error);
    }
    const dropdowns = await getUnemploymentRequestDropdownRows();
    let states: Awaited<ReturnType<typeof getUnemploymentContactStates>> = [];
    let statesError = "";
    try { states = await getUnemploymentContactStates(); }
    catch (error) { statesError = error instanceof Error ? error.message : "State list query failed."; }
    const faxColumn=await getUnemploymentContactFaxColumn();
    return NextResponse.json({ ok: true, data, contacts, contactsError, dropdowns, states, statesError, faxSupported:Boolean(faxColumn) });
  } catch (error) {
    console.error("[api/reports/ui-requests] Failed to load report rows:", error);
    const detail = error instanceof Error ? error.message : "Unknown database error.";
    return NextResponse.json({ ok: false, data: [], error: `Unable to load unemployment requests: ${detail}` }, { status: 500 });
  }
}
