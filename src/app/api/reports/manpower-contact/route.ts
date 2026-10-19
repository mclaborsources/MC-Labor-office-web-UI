import { NextResponse } from "next/server";
import { getManpowerContactPage, type ManpowerContactFilters } from "@/lib/manpowerReport";

const PAGE_SIZE = 250;
const SORTS = new Set(["customer", "salesman", "contact"]);

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const requestedSort = searchParams.get("sort") ?? "customer";
  const filters: ManpowerContactFilters = {
    page,
    pageSize: PAGE_SIZE,
    search: searchParams.get("search") ?? "",
    salesman: searchParams.get("salesman") ?? "",
    customerType: searchParams.get("customerType") ?? "",
    tracking: searchParams.get("tracking") === "yes" || searchParams.get("tracking") === "no"
      ? searchParams.get("tracking") as "yes" | "no"
      : "",
    oneContact: searchParams.get("oneContact") === "true",
    sort: SORTS.has(requestedSort) ? requestedSort as ManpowerContactFilters["sort"] : "customer",
    descending: searchParams.get("descending") === "true",
  };

  try {
    const result = await getManpowerContactPage(filters);
    return NextResponse.json({ ok: true, ...result, page, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error("[api/reports/manpower-contact]", error);
    return NextResponse.json({ ok: false, rows: [], total: 0, error: "Manpower contacts could not be loaded." }, { status: 500 });
  }
}
