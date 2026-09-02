import { insert } from "../../../lib/db";
import { configured } from "../../../lib/env";

/** Testimonial booking requests. Nothing is confirmed here — `state` starts at
 *  requested and only the console moves it on. */
export async function POST(request: Request) {
  const form = await request.formData();
  const value = (k: string) => String(form.get(k) ?? "").trim();

  const name = value("name");
  const email = value("email");
  const slots = value("slots");
  if (!name || !email || !slots) return redirectBack(request, "missing");
  if (!configured()) return redirectBack(request, "unconfigured");

  const format = value("format");
  try {
    await insert("bookings", {
      name, email,
      phone: value("phone") || null,
      format: ["in-person", "self-record", "either"].includes(format) ? format : null,
      requested_slots: slots,
      notes: value("notes") || null,
      state: "requested",
    });
  } catch {
    return redirectBack(request, "failed");
  }
  return redirectBack(request, "ok");
}

function redirectBack(request: Request, state: string) {
  const url = new URL("/testimonial", new URL(request.url).origin);
  url.searchParams.set("sent", state);
  return Response.redirect(url.toString(), 303);
}
