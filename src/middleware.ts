import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Main admin subdomain
  if (host === "main.gocyn.com" || host === "www.main.gocyn.com") {
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = "/admin/login";
      return NextResponse.rewrite(url);
    }
  }

  // Mentor subdomain
  if (host === "mentor.gocyn.com" || host === "http://localhost:3000/instructors/login") {
    if (!url.pathname.startsWith("/instructors")) {
      url.pathname = "/instructors/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|.*\\..*).*)",
  ],
};