import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    // Exclude login page or public assets if any inside admin directory, but they are not there
    const session = await getSession(request);

    if (!session || session.role !== "admin") {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ success: false, error: "Unauthorized: Admins only." }, { status: 401 });
      }
      // Redirect to login page
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
