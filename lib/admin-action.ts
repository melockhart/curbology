import { currentUser } from "./session";

/**
 * Every mutating admin route goes through this.
 *
 * `requireUser` redirects, which is right for a page and wrong for a POST — a
 * redirect to the sign-in page would look to the browser like the write
 * succeeded. These return 403 instead.
 */
export async function adminOnly(): Promise<{ email: string } | Response> {
  const email = await currentUser();
  if (!email) return new Response("Not signed in", { status: 403 });
  return { email };
}

export function backTo(request: Request, path: string) {
  return Response.redirect(new URL(path, new URL(request.url).origin).toString(), 303);
}
