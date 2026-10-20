import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { cachedQuickSearch, cachedQuickSearchPayroll, quickSearchCacheScope } from "@/lib/employeeQuickSearchCache";
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const params = new URL(request.url).searchParams;
    const scope = await quickSearchCacheScope(session);
    if (params.has("employeeId")) {
      const id = Number(params.get("employeeId"));
      if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid employee." }, { status: 400 });
      return NextResponse.json({ payroll: await cachedQuickSearchPayroll(scope, id, session.user?.officeStaffId), cacheScope: scope }, { headers: { "Cache-Control": "no-store" } });
    }
    const offset = Number(params.get("offset") ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ error: "Invalid record offset." }, { status: 400 });
    return NextResponse.json({ ...await cachedQuickSearch(scope, { name: params.get("name") ?? "",cell: params.get("cell") ?? "",search: params.get("search") ?? "",offset,staffId: session.user?.officeStaffId }, params.get("refresh") === "1"), cacheScope: scope }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Employee quick search could not be loaded. Please retry." }, { status: 503 }); }
}
