import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { loadCustomerPageData } from "@/lib/customerPageData";

export async function GET(request: Request) {
  await requireSession();
  const data = await loadCustomerPageData(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}
