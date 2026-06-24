import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/auth/constants";
import type { SessionData } from "@/types/auth";

export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  );
  session.destroy();
  return NextResponse.json({ ok: true });
}
