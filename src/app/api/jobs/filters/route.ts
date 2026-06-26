import { NextResponse } from "next/server";
import { getJobFilterOptions } from "@/lib/jobs";
import type { ApiFiltersResponse } from "@/types/search";

export async function GET(): Promise<NextResponse<ApiFiltersResponse>> {
  try {
    const { customers, salesmen, customerTypes, statuses } = await getJobFilterOptions();
    return NextResponse.json({
      ok: true,
      filters: { customers, salesmen, customerTypes, statuses },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load filters.";
    console.error("[api/jobs/filters]", err);
    return NextResponse.json(
      { ok: false, filters: {}, error: message },
      { status: 500 },
    );
  }
}
