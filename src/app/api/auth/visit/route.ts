import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  return NextResponse.json({ loginId: session.isLoggedIn ? session.officeStaffLoginId ?? null : null }, { headers: { "Cache-Control": "no-store" } });
}
