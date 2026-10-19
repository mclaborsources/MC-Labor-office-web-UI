import { NextResponse } from "next/server";
import { getContactReportRows, type ContactReportKind, type ContactReportSort } from "@/lib/contactReports";

const sorts = new Set<ContactReportSort>(["oldestInvoice", "customer", "totalOwed", "customerSince", "lastWeekInTracking"]);
const filters = new Set(["All Accounts", "Up to Term", "Over Term", "Up to 30", "Over 30", "Over 60", "Over 90", "Over 120", "01 Invoice", "Money Owed"]);

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  if (kind !== "invoices" && kind !== "verify-hours") {
    return NextResponse.json({ ok: false, error: "Invalid contact report type." }, { status: 400 });
  }
  try {
    const result = await getContactReportRows(kind as ContactReportKind, {
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 250),
      search: params.get("search") ?? "",
      tracking: params.get("tracking") === "yes" || params.get("tracking") === "no" ? params.get("tracking") as "yes" | "no" : "",
      salesman: params.get("salesman") ?? "",
      accountFilter: filters.has(params.get("accountFilter") ?? "") ? params.get("accountFilter") ?? "" : "All Accounts",
      sort: sorts.has(params.get("sort") as ContactReportSort) ? params.get("sort") as ContactReportSort : "oldestInvoice",
      descending: params.get("descending") === "true",
    });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/reports/contact-report]", error);
    return NextResponse.json({ ok: false, error: "Contact report rows could not be loaded from SQL Server." }, { status: 500 });
  }
}
