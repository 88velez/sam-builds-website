/**
 * Astro middleware — protects all /admin/* routes except /admin/login.
 */

import { defineMiddleware } from "astro:middleware";
import { verifySession } from "./lib/auth";

// The ONLY admin path reachable without authentication.
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;
  // Normalize a trailing slash so "/admin/login/" is treated like "/admin/login".
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  // Only apply to /admin/* routes
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Allow public admin paths (login only).
    if (PUBLIC_ADMIN_PATHS.includes(pathname)) {
      return next();
    }

    // Check for session cookie
    const sessionCookie = cookies.get("admin_session")?.value;
    const isValid = await verifySession(sessionCookie);

    if (!isValid) {
      // Redirect to login with return URL
      const loginUrl = new URL("/admin/login", url);
      loginUrl.searchParams.set("redirect", pathname);
      return Response.redirect(loginUrl, 302);
    }

    // Refresh the cookie on each request (sliding expiration)
    if (sessionCookie) {
      context.cookies.set("admin_session", sessionCookie, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: !import.meta.env.DEV,
      });
    }
  }

  return next();
});
