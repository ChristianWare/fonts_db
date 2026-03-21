/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import authConfig from "./auth.config";

export const { auth: withAuth } = NextAuth(authConfig);

type AppRole = "CLIENT" | "ADMIN";

function getRoles(req: any): AppRole[] {
  const roles = req?.auth?.user?.roles;
  return Array.isArray(roles) ? (roles as AppRole[]) : [];
}

function hasAnyRole(req: any, allowed: AppRole[]) {
  const roles = getRoles(req);
  if (!roles.length) return false;
  return allowed.some((r) => roles.includes(r));
}

function roleHome(req: any) {
  if (hasAnyRole(req, ["ADMIN"])) return "/admin";
  return "/dashboard";
}

export default withAuth((req: NextRequest & { auth?: any }) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Stripe webhook — no auth interference
  if (pathname === "/api/stripe/webhook") return NextResponse.next();

  // NextAuth internal routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const authPages = new Set(["/login", "/register"]);
  const publicPages = new Set([
    "/set-password",
    "/reset-password",
    "/verify-email",
  ]);

  if (publicPages.has(pathname)) return NextResponse.next();

  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isClientDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  const authedOnly = isAdminArea || isClientDashboard;

  const isLoggedIn = Boolean((req as any).auth?.user);

  // Logged-in users should not see auth pages
  if (isLoggedIn && authPages.has(pathname)) {
    return NextResponse.redirect(new URL(roleHome(req), nextUrl));
  }

  // Not logged in → redirect to login for protected areas
  if (!isLoggedIn && authedOnly) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // CLIENT attempting to access /admin → hard redirect to /dashboard
  if (isAdminArea && !hasAnyRole(req, ["ADMIN"])) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // ADMIN landing on /dashboard → redirect to /admin (unless previewing a client)
  if (isClientDashboard && hasAnyRole(req, ["ADMIN"])) {
    const isPreview = nextUrl.searchParams.has("as");
    if (!isPreview) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/stripe/webhook|_next|.*\\.(?:css|js(?!on)|mjs|map|jpg|jpeg|png|gif|svg|ico|webp|ttf|woff2?|txt|xml|webmanifest|pdf|zip)).*)",
  ],
};
