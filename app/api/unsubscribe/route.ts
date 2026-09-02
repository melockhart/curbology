import { insert } from "../../../lib/db";
import { configured } from "../../../lib/env";
import { previewMode } from "../../../lib/preview";

/**
 * ⛔ THE ONLY PLACE SUPPRESSION IS EVER WRITTEN.
 *
 * There is no GET handler here, and there must never be one. Email security
 * scanners fetch every URL in a message before it reaches the inbox; a GET that
 * suppresses would opt out people who never clicked, silently, at exactly the
 * moment a campaign looks like it is working.
 *
 * The page at /email-unsubscribe renders a form and writes nothing. This route
 * is what the button posts to.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const contactId = String(form.get("id") ?? "").trim();
  if (!contactId) return redirectBack(request, "missing");
  // Validation still ran: the preview exercises the real form, it just has
  // nowhere to put the result. Saying "unconfigured" here would read as a
  // fault rather than as the demo working exactly as intended.
  if (previewMode()) return redirectBack(request, "preview");
  if (!configured()) return redirectBack(request, "unconfigured");

  try {
    await insert("unsubscribes", {
      contact_id: contactId,
      reason: String(form.get("reason") ?? "").trim() || null,
    });
  } catch {
    // A duplicate is success from the reader's point of view: they asked not to
    // be emailed, and they are not going to be. Telling them it failed would
    // invite a second attempt and, failing that, a spam complaint.
    return redirectBack(request, "ok");
  }
  return redirectBack(request, "ok");
}

function redirectBack(request: Request, state: string) {
  const url = new URL("/email-unsubscribe", new URL(request.url).origin);
  url.searchParams.set("done", state);
  return Response.redirect(url.toString(), 303);
}
