import { NextResponse } from "next/server";
import { getCustomerSearchRows } from "@/lib/customers";
import type { CustomerSearchRow } from "@/types/customer";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const customerId = params.get("customerId")?.trim();
    const searchTerm = params.get("q")?.trim() ?? "";
    if (!customerId && !searchTerm) {
      return NextResponse.json({ ok: true, data: [], total: 0, page: 1, pageSize: 1_000, hasMore: false }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const requestedPage = Number(params.get("page") ?? "1");
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const result = await getCustomerSearchRows({
      ...(customerId ? { customerIds: [customerId] } : { customerName: searchTerm }),
      page,
      pageSize: customerId ? 1 : 1_000,
    });

    return NextResponse.json({ ok: true, ...result }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[api/customers/name-search/results] Customer rows could not be loaded.", error);
    return NextResponse.json({
      ok: false,
      data: [] satisfies CustomerSearchRow[],
      total: 0,
      page: 1,
      pageSize: 1_000,
      hasMore: false,
      error: "Matching customer data could not be loaded.",
    }, {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
