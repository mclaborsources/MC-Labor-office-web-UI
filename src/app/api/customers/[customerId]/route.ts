import { NextResponse } from "next/server";
import { getCustomerById } from "@/lib/customers";
import type { ApiDetailResponse } from "@/types/search";
import type { CustomerDetail } from "@/types/customer";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> },
): Promise<NextResponse<ApiDetailResponse<CustomerDetail>>> {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json({ ok: false, data: null, error: "Customer ID is required." }, { status: 400 });
    }

    const customer = await getCustomerById(customerId);

    if (!customer) {
      return NextResponse.json({ ok: false, data: null, error: "Customer not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: customer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load customer.";
    console.error("[api/customers/[customerId]]", err);
    return NextResponse.json({ ok: false, data: null, error: message }, { status: 500 });
  }
}
