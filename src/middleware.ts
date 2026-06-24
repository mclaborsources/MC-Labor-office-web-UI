import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      return NextResponse.redirect(new URL("/tracking", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/tracking") {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tracking", "/login"],
};
