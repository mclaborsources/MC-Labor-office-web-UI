import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions } from "@/lib/auth/constants";
import type { SessionData } from "@/types/auth";
import { defaultSession } from "@/types/auth";

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions(),
  );
  return session;
}

export async function getSessionOrDefault(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return { ...defaultSession };
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
