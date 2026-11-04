import { runtimeEnv } from "../../../lib/env";
import { DRAFT_COOKIE, verifyDraftCookie } from "../../../lib/cms/signing";

/**
 * Opens a signed draft link: sets the preview cookie and goes to the page. Only
 * this browser sees the draft, and the link stops working when it expires.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = runtimeEnv().CMS_SIGNING_SECRET;
  const token = url.searchParams.get("t") ?? "";
  if (url.searchParams.get("exit") !== null) return leave(url, `${DRAFT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  if (!secret || !(await verifyDraftCookie(token, secret, Date.now()))) {
    return new Response("This preview link has expired.", { status: 410, headers: { "X-Robots-Tag": "noindex" } });
  }
  const seconds = Math.max(0, Math.floor((Number(token.split(".")[1]) - Date.now()) / 1000));
  return leave(url, `${DRAFT_COOKIE}=${token}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`);
}

function leave(url: URL, cookie: string): Response {
  const path = url.searchParams.get("path") ?? "/";
  // Same-site paths only. An absolute URL here would be an open redirect.
  const target = path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/";
  return new Response(null, {
    status: 303,
    headers: { Location: target, "Set-Cookie": cookie, "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
