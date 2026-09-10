import type { SessionOptions } from "iron-session";
import { getEnv } from "@/lib/config/env";

import { SESSION_COOKIE_NAME } from "./cookie";
export { SESSION_COOKIE_NAME } from "./cookie";

/** Read SESSION_SECRET at request time — not at module load (Next.js env bundling). */
export function getSessionOptions(): SessionOptions {
  const { SESSION_SECRET } = getEnv();

  return {
    password: SESSION_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    },
  };
}
