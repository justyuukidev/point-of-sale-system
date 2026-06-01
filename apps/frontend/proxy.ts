import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "./app/lib/auth";

function isProtectedRoute(pathname: string): boolean {
  const protectedPrefixes = [
    "/console",
    "/dashboard",
    "/sales-pos",
    "/inventory-supply",
    "/reports-compliance",
    "/administration",
  ];

  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicOnlyRoute(pathname: string): boolean {
  return pathname === "/login";
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = getSessionToken(req.cookies);
  const isAuthenticated = Boolean(sessionToken);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicOnlyRoute(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
