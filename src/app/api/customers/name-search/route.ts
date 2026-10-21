import { NextResponse } from "next/server";
import { searchCustomerNames } from "@/lib/customers";
import { gzip } from "node:zlib";
import { promisify } from "node:util";
import { packCustomers } from "@/lib/customerSearchTransport";
import { getCustomerSearch1Ids } from "@/lib/customerSearch1";

const compress = promisify(gzip);

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.get("ids") === "1") {
      const ids = await getCustomerSearch1Ids(Object.fromEntries(params));
      return NextResponse.json({ ids: ids ? [...ids] : null }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const searchTerm = params.get("q") ?? "";
    const includeAll = params.get("all") === "1";
    if (!searchTerm.trim() && !includeAll) {
      return NextResponse.json({ ok: true, data: [] }, {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const result = await searchCustomerNames(searchTerm, includeAll);
    if (params.get("packed") === "1") {
      const ids = await getCustomerSearch1Ids(Object.fromEntries(params));
      const rows = ids ? result.data.filter(row => ids.has(row.customerId)) : result.data;
      const body = await compress(packCustomers(rows), { level: 1 });
      return new Response(new Uint8Array(body), { headers: {
        "Content-Type": "application/json; charset=utf-8", "Content-Encoding": "gzip",
        "Cache-Control": "private, no-store", "Vary": "Accept-Encoding",
        "X-Customer-Count": String(result.data.length),
      } });
    }
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
