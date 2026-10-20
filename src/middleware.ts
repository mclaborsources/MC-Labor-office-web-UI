import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";
import { isLocalMode, isOfficeStaffMode } from "@/lib/auth/mode";

const PROTECTED_PREFIXES = [
  "/tracking",
  "/employees",
  "/customers",
  "/jobs",
  "/dashboard",
  "/customer-menu",
  "/admin",
  "/reports",
  "/health-ins",
  "/deleted-employees",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  if (isLocalMode()) return NextResponse.next();
  const { pathname } = request.nextUrl;

  if (isOfficeStaffMode()) {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      const expected = `${request.nextUrl.protocol}//${request.headers.get("host") ?? request.nextUrl.host}`;
      if (origin !== expected) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
    if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();
    const checkUrl = new URL("/api/auth/access", request.url);
    checkUrl.searchParams.set("path", pathname);
    checkUrl.searchParams.set("method", request.method);
    let status = 503;
    try {
      const checked = await fetch(checkUrl, { headers: { cookie: request.headers.get("cookie") ?? "" }, cache: "no-store" });
      status = checked.status;
    } catch { /* A failed permission check must not allow access. */ }
    if (status === 200) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: status === 401 ? "Sign-in required." : "Access denied or office permissions unavailable." }, { status });
    if (status === 401 || status === 409) {
      const target = new URL("/login", request.url);
      target.searchParams.set("from", pathname);
      return NextResponse.redirect(target);
    }
    return new NextResponse(status === 403 ? "You do not have permission to open this screen. Contact your office administrator." : "Office permissions could not be checked. Please retry.", { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isLoggedIn = Boolean(sessionCookie?.value);

  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff2?|css|js)$).*)"],
};
