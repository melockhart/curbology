import { countRedirectHit, findRedirect } from "../../lib/db";
import { hasPage, renderPage } from "../../lib/v2/render";

/**
 * Every public page, and the last stop before a 404. Real routes such as /quote,
 * /admin and the API match first. The redirects table comes next, so an old URL
 * keeps working, and only then the not-found page with a real 404 status.
 */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const from = `/${(path ?? []).join("/")}`;
  if (hasPage(from)) {
    const sent = new URL(request.url).searchParams.get("sent");
    // A successful form lands on the approved confirmation screen.
    if (from === "/contact" && sent === "ok") return renderPage("/contact/sent", new Request(new URL("/contact/sent", request.url)));
    return renderPage(from, request);
  }
  const rule = await findRedirect(from);
  if (rule) {
    await countRedirectHit(from);
    return Response.redirect(new URL(rule.to_path, request.url).toString(), rule.permanent ? 308 : 307);
  }
  return renderPage("/404", request, 404);
}
