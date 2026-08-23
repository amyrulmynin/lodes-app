import { NextRequest, NextResponse } from "next/server";

// Edge-safe auth check: only verify the session cookie exists.
// Full session validation happens server-side in each page/API route.
// This avoids importing the DB layer (which uses better-sqlite3 locally)
// into the Edge Runtime.
export function middleware(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/invoices/:path*",
    "/transactions/:path*",
  ],
};
