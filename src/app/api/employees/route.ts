import { NextResponse } from "next/server";
import { getEmployees } from "@/lib/employees";
import type { ApiListResponse } from "@/types/search";
import type { EmployeeSummary } from "@/types/employee";

export async function GET(request: Request): Promise<NextResponse<ApiListResponse<EmployeeSummary>>> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const tradeId = searchParams.get("tradeId") ?? undefined;
    const statusId = searchParams.get("statusId") ?? undefined;
    const gradeId = searchParams.get("gradeId") ?? undefined;

    const result = await getEmployees({ search, tradeId, statusId, gradeId });

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
      { ok: false, data: [], total: 0, page: 1, pageSize: 200, hasMore: false, error: message },
      { status: 500 },
    );
  }
}
