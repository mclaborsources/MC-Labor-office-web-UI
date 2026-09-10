import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/auth/constants";
import type { SessionData } from "@/types/auth";
import { defaultSession } from "@/types/auth";
import { getDatabaseSettings } from "@/lib/config/database";
import { redirect } from "next/navigation";

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  );
  return session;
}

export async function getSessionOrDefault(checkDatabase = true): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { ...defaultSession };
  }
  if (checkDatabase) {
    let configured = false;
    try { configured = Boolean(getDatabaseSettings()); } catch { /* Recover in setup. */ }
    if (!configured) redirect("/setup");
  }
  return session;
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.active) {
    throw new Error("Unauthorized");
  }
  return session;
}
