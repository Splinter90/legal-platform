import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin")) {
      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    if (path.startsWith("/lawyer")) {
      if (token?.role !== "lawyer") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    if (path.startsWith("/client")) {
      if (token?.role !== "client") {
        return NextResponse.redirect(new URL("/login?error=unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/admin") ||
          path.startsWith("/lawyer") ||
          path.startsWith("/client")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/lawyer/:path*", "/client/:path*"],
};
