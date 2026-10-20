import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/auth/constants";
import type { SessionData } from "@/types/auth";
import { endOfficeLogin } from "@/lib/auth/office-staff";
import { hasSameOrigin } from "@/lib/auth/origin";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  );
  // A delayed close request from an older page must not close a newer login.
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (body?.closingLoginId !== undefined && body.closingLoginId !== session.officeStaffLoginId) return NextResponse.json({ ok: true });
  }
  try {
    if (session.officeStaffLoginId && session.user?.officeStaffId) await endOfficeLogin(session.officeStaffLoginId, session.user.officeStaffId);
  } catch {
    return NextResponse.json({ error: "Logout could not be recorded. Please retry." }, { status: 503 });
  }
  session.destroy();
  return NextResponse.json({ ok: true });
}
