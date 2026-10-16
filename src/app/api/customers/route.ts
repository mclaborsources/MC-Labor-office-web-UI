import { NextResponse } from "next/server";
import { getCustomers } from "@/lib/customers";
import type { ApiListResponse } from "@/types/search";
import type { CustomerSummary } from "@/types/customer";

export async function GET(request: Request): Promise<NextResponse<ApiListResponse<CustomerSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const customerName = searchParams.get("customerName") ?? undefined;
    const customerPhone = searchParams.get("customerPhone") ?? undefined;
    const contactName = searchParams.get("contactName") ?? undefined;
    const contactPhone = searchParams.get("contactPhone") ?? undefined;
    const contactEmail = searchParams.get("contactEmail") ?? undefined;
    const contactText = searchParams.get("contactText") ?? undefined;
    const salesmanId = searchParams.get("salesmanId") ?? undefined;
    const customerTypeId = searchParams.get("customerTypeId") ?? undefined;
    const statusId = searchParams.get("statusId") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const state = searchParams.get("state") ?? undefined;
    const requestedPage = Number(searchParams.get("page") ?? "1");
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

    const result = await getCustomers({
      search,
      customerName,
      customerPhone,
      contactName,
      contactPhone,
      contactEmail,
      contactText,
      salesmanId,
      customerTypeId,
      statusId,
      city,
      state,
      page,
      pageSize: 300,
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
    const message = err instanceof Error ? err.message : "Failed to load customers.";
    console.error("[api/customers]", err);
    return NextResponse.json(
      { ok: false, data: [], total: 0, page: 1, pageSize: 200, hasMore: false, error: message },
      { status: 500 },
    );
  }
}
