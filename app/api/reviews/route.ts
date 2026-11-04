import { insert } from "../../../lib/db";
import { configured } from "../../../lib/env";
import { previewMode } from "../../../lib/preview";

/**
 * The review portal.
 *
 * `published` is set to false here and can only be changed from the console.
 * That is the whole point of collecting on-site: the owner chooses what the
 * site shows, and cannot make a review vanish from his own inbox.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const value = (k: string) => String(form.get(k) ?? "").trim();

  const name = value("name");
  const email = value("email");
  const body = value("body");
  const rating = Number(value("rating"));

  if (!name || !email || !body || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return redirectBack(request, "missing");
  }
  // Validation still ran: the preview exercises the real form, it just has
  // nowhere to put the result. Saying "unconfigured" here would read as a
  // fault rather than as the demo working exactly as intended.
  if (previewMode()) return redirectBack(request, "preview");
  if (!configured()) return redirectBack(request, "unconfigured");

  try {
    await insert("reviews", {
      name, email, body, rating,
      service: value("service") || null,
      consented: form.get("consent") === "yes",
      published: false,
      status: "new",
    });
  } catch {
    return redirectBack(request, "failed");
  }
  // The approved confirmation screens. The Google link on each is the same for every rating.
  return Response.redirect(new URL(rating <= 2 ? "/review/thanks-low" : "/review/thanks", request.url).toString(), 303);
}

function redirectBack(request: Request, state: string) {
  const url = new URL("/review", new URL(request.url).origin);
  url.searchParams.set("sent", state);
  return Response.redirect(url.toString(), 303);
}
