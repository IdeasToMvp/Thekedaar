import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protects only /app and /recruiter. Does NOT run on `/`, `/login`, public routes, or `/api/*`.
 *
 * Set DISABLE_ROUTE_GUARD=1 on Vercel to skip redirects (debug only).
 */
export function middleware(req: NextRequest) {
  try {
    if (process.env.DISABLE_ROUTE_GUARD === "1") {
      return NextResponse.next();
    }

    const { pathname } = req.nextUrl;

    // Extra safety: never touch homepage or auth pages
    if (
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon")
    ) {
      return NextResponse.next();
    }

    const needsAuth = pathname.startsWith("/app") || pathname.startsWith("/recruiter");
    if (!needsAuth) {
      return NextResponse.next();
    }

    const cookieName = process.env.SESSION_COOKIE_NAME || "tk_session";
    const token = req.cookies.get(cookieName)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/app", "/app/:path*", "/recruiter", "/recruiter/:path*"],
};
