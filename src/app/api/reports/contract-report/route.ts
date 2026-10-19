import { NextResponse } from "next/server";
import { getContractReportCustomers } from "@/lib/contractReport";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const data = await getContractReportCustomers({
      search: params.get("search") ?? "",
      company: params.get("company") ?? "IPG",
      problemsOnly: params.get("problemsOnly") !== "false",
      page: Number(params.get("page") ?? 1),
      pageSize: Number(params.get("pageSize") ?? 100),
    });
    return NextResponse.json({ ok: true, ...data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/reports/contract-report]", error);
    return NextResponse.json(
      { ok: false, data: [], error: "Contract report customers could not be loaded." },
      { status: 500 },
    );
  }
}
