import { SESSION_COOKIE } from "../../../lib/session";

export async function POST(request: Request) {
  const headers = new Headers({ Location: new URL("/sign-in", new URL(request.url).origin).toString() });
  headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return new Response(null, { status: 303, headers });
}
