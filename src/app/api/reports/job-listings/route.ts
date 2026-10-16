import { NextRequest, NextResponse } from "next/server";
import { getJobListingPage } from "@/lib/jobListingReports";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const requestedKind = params.get("kind");
  const kind = requestedKind === "employees" || requestedKind === "ocip" || requestedKind === "rate" || requestedKind === "shift" ? requestedKind : "current";
  const page = Number(params.get("page") ?? 1);
  const pageSize = Number(params.get("pageSize") ?? 100);
  try {
    const result = await getJobListingPage({
      kind, page, pageSize,
      customer: params.get("customer") ?? "",
      job: params.get("job") ?? "",
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error(`[job-listings:${kind}] Failed to load report`, error);
    return NextResponse.json({ ok: false, error: "The job report could not be loaded." }, { status: 500 });
  }
}
