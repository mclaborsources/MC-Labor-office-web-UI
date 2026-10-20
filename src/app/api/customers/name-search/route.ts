import { NextResponse } from "next/server";
import { searchCustomerNames } from "@/lib/customers";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const searchTerm = params.get("q") ?? "";
    const includeAll = params.get("all") === "1";
    if (!searchTerm.trim() && !includeAll) {
      return NextResponse.json({ ok: true, data: [] }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const result = await searchCustomerNames(searchTerm, includeAll);
    return NextResponse.json({ ok: true, ...result }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[api/customers/name-search] Customer name search failed.", error);
    return NextResponse.json({ ok: false, data: [], error: "Customer names could not be searched." }, {
      status: 500,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
