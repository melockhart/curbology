import { insert } from "../../../lib/db";
import { configured } from "../../../lib/env";

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
  return redirectBack(request, "ok");
}

function redirectBack(request: Request, state: string) {
  const url = new URL("/review", new URL(request.url).origin);
  url.searchParams.set("sent", state);
  return Response.redirect(url.toString(), 303);
}
