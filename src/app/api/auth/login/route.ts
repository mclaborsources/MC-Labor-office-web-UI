import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/config/env";
import { getSessionOptions } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import type { SessionData } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const env = getEnv();

    if (username !== env.DEV_LOGIN_USERNAME) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(password, env.DEV_LOGIN_PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      getSessionOptions(),
    );

    session.user = {
      userId: "dev-1",
      username: env.DEV_LOGIN_USERNAME,
      displayName: env.DEV_LOGIN_DISPLAY_NAME,
      active: true,
      roles: ["admin"],
    };
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[api/auth/login]", error);
    }
    return NextResponse.json(
      { error: "Login failed. Check server configuration." },
      { status: 500 },
    );
  }
}
