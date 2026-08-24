import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { clientIpFromHeaders, rateLimit } from "@/lib/security/rate-limit";

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 25;
const EXPORT_LIMIT = 15;
const EXPORT_WINDOW_MS = 60 * 1000;

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const ip = clientIpFromHeaders(request.headers);

  if (pathname.startsWith("/api/auth") && method === "POST") {
    const limited = rateLimit(`auth:${ip}`, AUTH_LIMIT, AUTH_WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: "Muitas tentativas de autenticação. Aguarde e tente novamente.",
          retryAfterSec: limited.retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/reports/export")) {
    const limited = rateLimit(`export:${ip}`, EXPORT_LIMIT, EXPORT_WINDOW_MS);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Muitos exports. Aguarde um momento." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }
  }

  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  const isProtectedApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/quotes") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/opportunities");

  if (isProtectedApp && !request.auth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/pipeline/:path*",
    "/quotes/:path*",
    "/orders/:path*",
    "/products/:path*",
    "/insights/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/opportunities/:path*",
    "/api/auth/:path*",
    "/api/reports/:path*",
    "/api/cron/:path*",
  ],
};
