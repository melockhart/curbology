import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/reviews", async (form, session) => {
    const id = String(form.get("id") ?? "");
    if (!id) throw new Error("Missing review");
    // Archived leaves the queue; it does not delete. There is no delete here on
    // purpose — choosing what the site shows is curation, making a review
    // disappear is not, and there is no policy or function that would allow it.
    await rpc("review_set_state", {
      _id: id,
      // The site follows the review rule, not this flag, so it is always on.
      _published: true,
      _archived: form.get("archived") === "yes",
      _reply: String(form.get("owner_reply") ?? "").trim(),
    }, session);
  });
}
