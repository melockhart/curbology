import { patch } from "../../../../lib/db";
import { adminOnly, backTo } from "../../../../lib/admin-action";

const STATES = ["requested", "confirmed", "recorded", "received", "published", "declined", "no-show"];

export async function POST(request: Request) {
  const auth = await adminOnly();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const state = String(form.get("state") ?? "");
  if (!id || !STATES.includes(state)) return new Response("Bad request", { status: 400 });

  const video = String(form.get("video_url") ?? "").trim();
  await patch("bookings", id, { state, video_url: video || null });
  return backTo(request, "/admin/bookings");
}
