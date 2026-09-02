import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/bookings", async (form, session) => {
    const id = String(form.get("id") ?? "");
    if (!id) throw new Error("Missing booking");
    await rpc("booking_set_state", {
      _id: id,
      _state: String(form.get("state") ?? ""),
      _video_url: String(form.get("video_url") ?? "").trim(),
    }, session);
  });
}
