import { insert } from "../../../lib/db";
import { configured } from "../../../lib/env";
import { previewMode } from "../../../lib/preview";

/**
 * The quote form.
 *
 * The browser never writes to Supabase directly. This route decides `status`
 * and the timestamp; a client-side insert with an anon key would let anyone
 * file a lead already marked won, or spam.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const value = (k: string) => String(form.get(k) ?? "").trim();

  const name = value("name");
  const email = value("email");
  if (!name || !email) return redirectBack(request, "missing");

  // Validation still ran: the preview exercises the real form, it just has
  // nowhere to put the result. Saying "unconfigured" here would read as a
  // fault rather than as the demo working exactly as intended.
  if (previewMode()) return redirectBack(request, "preview");
  if (!configured()) return redirectBack(request, "unconfigured");

  try {
    await insert("leads", {
      name,
      email,
      phone: value("phone") || null,
      address: value("address") || null,
      service: value("service") || null,
      message: value("message") || null,
      source_page: request.headers.get("referer"),
      // photo_paths is left empty: uploads go to storage in a follow-up, and a
      // half-wired upload that silently drops the file is worse than none.
      status: "new",
    });
  } catch {
    return redirectBack(request, "failed");
  }
  return redirectBack(request, "ok");
}

function redirectBack(request: Request, state: string) {
  const url = new URL("/contact", new URL(request.url).origin);
  url.searchParams.set("sent", state);
  return Response.redirect(url.toString(), 303);
}
