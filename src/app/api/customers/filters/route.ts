import { NextResponse } from "next/server";
import { getCustomerFilterOptions } from "@/lib/customers";
import type { ApiFiltersResponse } from "@/types/search";

export async function GET(): Promise<NextResponse<ApiFiltersResponse>> {
  try {
    const { salesmen, customerTypes } = await getCustomerFilterOptions();
    return NextResponse.json({
      ok: true,
      filters: { salesmen, customerTypes },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load filters.";
    console.error("[api/customers/filters]", err);
    return NextResponse.json(
      { ok: false, filters: { salesmen: [], customerTypes: [] }, error: message },
      { status: 500 },
    );
  }
}
