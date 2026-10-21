import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/config/env";
import { getSessionOptions } from "@/lib/auth/constants";
import { verifyPassword } from "@/lib/auth/password";
import type { SessionData } from "@/types/auth";
import { getDatabaseSettings } from "@/lib/config/database";
import { isOfficeStaffMode } from "@/lib/auth/mode";
import { authenticateOfficeStaff, startOfficeLogin, endOfficeLogin } from "@/lib/auth/office-staff";
import { hasSameOrigin } from "@/lib/auth/origin";
import { prepareLoginPrompts } from "@/lib/auth/login-prompts";
import { currentSessionGeneration } from "@/lib/auth/session-generation";

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (isOfficeStaffMode()) {
      const id = Number(body.officeStaffId);
      if (!Number.isSafeInteger(id) || id <= 0 || !password || password.length > 1024) {
        return NextResponse.json({ error: "Select your office account and enter your password." }, { status: 400 });
      }
      const user = await authenticateOfficeStaff(id, password);
      if (!user) return NextResponse.json({ error: "Invalid account or password." }, { status: 401 });
      const session = await getIronSession<SessionData>(await cookies(), getSessionOptions());
      const loginId = await startOfficeLogin(user);
      try {
        if (session.officeStaffLoginId && session.user?.officeStaffId) await endOfficeLogin(session.officeStaffLoginId, session.user.officeStaffId);
        session.user = user;
        session.loginGeneration = currentSessionGeneration();
        session.officeStaffLoginId = loginId;
        const prompts = await prepareLoginPrompts(user);
        session.loginNoteDate = prompts.noteDate;
        session.loginRemindersPending = prompts.showReminders;
        session.needsLoginPrompts = !!prompts.noteDate || prompts.showReminders;
        session.isLoggedIn = true;
        await session.save();
      } catch (error) {
        await endOfficeLogin(loginId, user.officeStaffId!);
        throw error;
      }
      return NextResponse.json({ ok: true, needsSetup: false, nextPath: session.needsLoginPrompts ? "/login" : "/dashboard" });
    }

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

    let needsSetup = true;
    try { needsSetup = !getDatabaseSettings(); } catch { /* Allow configuration recovery. */ }
    return NextResponse.json({ ok: true, needsSetup });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Too many attempts")) return NextResponse.json({ error: error.message }, { status: 429 });
    if (process.env.NODE_ENV === "development") {
      console.error("[api/auth/login]", error);
    }
    return NextResponse.json(
      { error: "Login failed. Check server configuration." },
      { status: 500 },
    );
  }
}
