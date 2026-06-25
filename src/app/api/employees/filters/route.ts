import { NextResponse } from "next/server";
import { getEmployeeFilterOptions } from "@/lib/employees";
import type { ApiFiltersResponse } from "@/types/search";

export async function GET(): Promise<NextResponse<ApiFiltersResponse>> {
  try {
    const { trades, statuses, grades } = await getEmployeeFilterOptions();
    return NextResponse.json({
      ok: true,
      filters: { trades, statuses, grades },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load filters.";
    console.error("[api/employees/filters]", err);
    return NextResponse.json(
      { ok: false, filters: { trades: [], statuses: [], grades: [] }, error: message },
      { status: 500 },
    );
  }
}
