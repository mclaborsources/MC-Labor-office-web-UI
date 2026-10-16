import { NextResponse } from "next/server";
import { getAllJobsReportRows } from "@/lib/allJobsReport";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 250) {
    return NextResponse.json({ ok: false, error: "Invalid All Jobs page request." }, { status: 400 });
  }
  try {
    const result = await getAllJobsReportRows({ page, pageSize, customer: params.get("customer") ?? "", job: params.get("job") ?? "" });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api/reports/all-jobs] Unable to load report:", error);
    return NextResponse.json({ ok: false, error: "All Jobs could not be loaded from the database." }, { status: 500 });
  }
}
