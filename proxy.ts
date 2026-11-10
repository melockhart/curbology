import { NextResponse, type NextRequest } from "next/server";

/**
 * Passes the requested console address to the server, so a signed-out visitor
 * sent to sign-in comes back to the page they asked for instead of Today.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-curbology-path", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin/:path*", "/connections"] };
