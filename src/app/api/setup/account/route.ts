import { NextResponse } from "next/server";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { localAccountFile, needsAccountSetup } from "@/lib/config/env";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    return NextResponse.json({ error: "Open setup on the computer running MC Labor." }, { status: 403 });
  }
  if (!needsAccountSetup()) return NextResponse.json({ error: "This installation already has an administrator login." }, { status: 409 });
  const parsed = z.object({ username: z.string().trim().min(1).max(100), password: z.string().min(8).max(72) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a username and a password of 8–72 characters." }, { status: 400 });
  const passwordHash = await hash(parsed.data.password, 12);
  const secretFile = path.join(path.dirname(localAccountFile), "session-secret");
  const existingSecret = process.env.SESSION_SECRET || (existsSync(secretFile) ? readFileSync(secretFile, "utf8") : "");
  try {
    mkdirSync(path.dirname(localAccountFile), { recursive: true, mode: 0o700 });
    writeFileSync(localAccountFile, JSON.stringify({
      SESSION_SECRET: existingSecret.length >= 32 ? existingSecret : randomBytes(48).toString("hex"),
      DEV_LOGIN_USERNAME: parsed.data.username,
      DEV_LOGIN_PASSWORD_HASH: passwordHash,
      DEV_LOGIN_DISPLAY_NAME: parsed.data.username,
    }), { flag: "wx", mode: 0o600 });
    const session = await getSession();
    session.user = { userId: "dev-1", username: parsed.data.username, displayName: parsed.data.username, active: true, roles: ["admin"] };
    session.isLoggedIn = true;
    await session.save();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to finish account setup. Try signing in if the account was saved, or check access to the app folder." }, { status: 500 });
  }
}
