import { NextResponse } from "next/server";
import { getCustomerUserFlagOptions } from "@/lib/customers";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, options: await getCustomerUserFlagOptions() });
  } catch (error) {
    console.error("[api/customers/user-flags] Failed to load customer user flags:", error);
    return NextResponse.json({ ok: false, options: [], error: "Customer user settings could not be loaded." }, { status: 500 });
  }
}
