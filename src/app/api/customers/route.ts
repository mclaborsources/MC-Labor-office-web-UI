import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/customers";
import type { ApiListResponse } from "@/types/search";
import type { CustomerSummary } from "@/types/customer";

export async function GET(request: Request): Promise<NextResponse<ApiListResponse<CustomerSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const salesmanId = searchParams.get("salesmanId") ?? undefined;
    const customerTypeId = searchParams.get("customerTypeId") ?? undefined;

    const result = await getCustomers({ search, salesmanId, customerTypeId });

    return NextResponse.json({
      ok: true,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load customers.";
    console.error("[api/customers]", err);
    return NextResponse.json(
      { ok: false, data: [], total: 0, page: 1, pageSize: 200, hasMore: false, error: message },
      { status: 500 },
    );
  }
}
