import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
  const token = req.cookies.get(cookieName)?.value;

  const pathname = req.nextUrl.pathname;
  const needsAuth = pathname.startsWith("/app") || pathname.startsWith("/recruiter");

  if (needsAuth && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/recruiter/:path*"],
};

