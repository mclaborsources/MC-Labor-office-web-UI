import { NextRequest, NextResponse } from "next/server";
import { getTSheetsLinkedPage } from "@/lib/tSheetsLinked";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const startDate = params.get("startDate") ?? "";
  const endDate = params.get("endDate") ?? "";
  const page = Number(params.get("page") ?? 1);
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(startDate) || !validDate(endDate) || startDate > endDate || !Number.isInteger(page) || page < 1) {
    return NextResponse.json({ ok: false, error: "Choose a valid start and end week." }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, ...await getTSheetsLinkedPage({ startDate, endDate, page }) });
  } catch (error) {
    console.error("[t-sheets-linked] Unable to load timesheets:", error);
    return NextResponse.json({ ok: false, error: "T Sheets Linked records could not be loaded from SQL Server." }, { status: 500 });
  }
}
