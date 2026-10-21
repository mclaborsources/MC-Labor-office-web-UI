import { NextResponse } from "next/server";
import { getEmployees } from "@/lib/employees";
import type { ApiListResponse } from "@/types/search";
import type { EmployeeSummary } from "@/types/employee";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
const compress = promisify(gzip);

export async function GET(request: Request): Promise<Response | NextResponse<ApiListResponse<EmployeeSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const tradeId = searchParams.get("tradeId") ?? undefined;
    const statusId = searchParams.get("statusId") ?? undefined;
    const gradeId = searchParams.get("gradeId") ?? undefined;
    const city = searchParams.get("city") ?? undefined;
    const state = searchParams.get("state") ?? undefined;

    const started = performance.now();
    const result = await getEmployees({ search, tradeId, statusId, gradeId, city, state });
    const queryMs = Math.round(performance.now() - started);
    if (searchParams.get("compressed") === "1") {
      const body = await compress(JSON.stringify(result.data), { level: 1 });
      return new Response(new Uint8Array(body), { headers: {
        "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip",
        "Cache-Control": "private, no-store", "Vary": "Accept-Encoding",
        "X-Record-Count": String(result.data.length), "X-Query-Ms": String(queryMs),
      } });
    }

    return NextResponse.json({
      ok: true,
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load employees.";
    console.error("[api/employees]", err);
    return NextResponse.json(
      { ok: false, data: [], total: 0, page: 1, pageSize: 0, hasMore: false, error: message },
      { status: 500 },
    );
  }
}
