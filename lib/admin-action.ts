import { currentSession, type Session } from "./session";

/**
 * Every mutating admin route goes through this.
 *
 * `requireUser` redirects, which is right for a page and wrong for a POST — a
 * redirect to the sign-in page would look to the browser like the write
 * succeeded. These return 403 instead.
 */
export async function adminOnly(): Promise<Session | Response> {
  const session = await currentSession();
  if (!session) return new Response("Not signed in", { status: 403 });
  return session;
}

/** Back to where the form was, with a one-shot banner. Keeps a Save on the
 *  content screen from bouncing someone to the top of a different page. */
export function backWith(request: Request, path: string, state: "saved" | "error", message?: string) {
  const url = new URL(path, new URL(request.url).origin);
  url.searchParams.set("s", state);
  if (message) url.searchParams.set("m", message.slice(0, 200));
  return Response.redirect(url.toString(), 303);
}
