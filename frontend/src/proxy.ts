import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = [
  "/dashboard",
  "/practice",
  "/learning_map",
  "/checkin",
  "/badges",
  "/leaderboard",
  "/exercises",
  "/profile",
  "/settings",
];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function redirectToLogin(pathname: string, baseUrl: URL) {
  const loginUrl = new URL("/login", baseUrl);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Build a NextResponse.next() that carries the current pathname to the
 * root layout via a custom request header. The async server-component
 * RootLayout reads it with `headers()` to conditionally render UI
 * (e.g. hide the global Navbar on /exercises/[id] Focus Mode).
 *
 * Centralising this here keeps `proxy.ts` as the single Next.js 16
 * edge entry point (Next.js 16 forbids having both `proxy.ts` and
 * `middleware.ts`).
 */
function nextWithPathname(req: NextRequest, pathname: string) {
  // Clone existing request headers + inject x-pathname so it reaches
  // server components via `headers()` in RootLayout. Setting headers on
  // the response alone does not propagate to request headers.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  // Forward modified request headers to downstream server components
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export default auth((req) => {
  const { nextUrl } = req;

  // Skip API routes, static assets, and images (Next.js 16 proxy should not intercept these)
  if (
    nextUrl.pathname.startsWith("/api") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.includes("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(req.auth);

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return redirectToLogin(nextUrl.pathname, nextUrl);
    }
  }

  if (isProtectedPath(nextUrl.pathname) && !isAuthenticated) {
    return redirectToLogin(nextUrl.pathname, nextUrl);
  }

  return nextWithPathname(req, nextUrl.pathname);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
