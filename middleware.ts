import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin routes and Certificate Studio
  if (
    path.startsWith("/admin") ||
    path.startsWith("/api/admin") ||
    path.startsWith("/certificate")
  ) {
    const session = await getSession(request);

    if (!session || session.role !== "admin") {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admins only." },
          { status: 401 }
        );
      }
      // Redirect unauthenticated/non-admin users to login page
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Matching Paths
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/certificate",
    "/certificate/:path*",
  ],
};
