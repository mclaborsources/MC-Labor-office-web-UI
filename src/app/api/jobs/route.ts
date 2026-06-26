import { NextResponse } from "next/server";
import { getJobs } from "@/lib/jobs";
import type { ApiListResponse } from "@/types/search";
import type { JobSummary } from "@/types/job";

export async function GET(request: Request): Promise<NextResponse<ApiListResponse<JobSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getJobs({
      search:         searchParams.get("search")         ?? undefined,
      customerId:     searchParams.get("customerId")     ?? undefined,
      salesmanId:     searchParams.get("salesmanId")     ?? undefined,
      customerTypeId: searchParams.get("customerTypeId") ?? undefined,
      statusId:       searchParams.get("statusId")       ?? undefined,
      city:           searchParams.get("city")           ?? undefined,
      state:          searchParams.get("state")          ?? undefined,
    });

    return NextResponse.json({
      ok: true,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load jobs.";
    console.error("[api/jobs]", err);
    return NextResponse.json(
      { ok: false, data: [], total: 0, page: 1, pageSize: 200, hasMore: false, error: message },
      { status: 500 },
    );
  }
}
