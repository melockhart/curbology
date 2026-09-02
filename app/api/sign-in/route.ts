import { signIn, SESSION_COOKIE } from "../../../lib/session";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const origin = new URL(request.url).origin;

  const result = await signIn(email, password);
  if ("error" in result && result.error) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", result.error);
    return Response.redirect(url.toString(), 303);
  }

  const headers = new Headers({ Location: new URL("/admin", origin).toString() });
  // HttpOnly so script cannot read it; SameSite=Lax so it does not ride along
  // on a cross-site POST; Secure because this only ever runs over HTTPS.
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${result.token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${result.expiresIn}`,
  );
  return new Response(null, { status: 303, headers });
}
