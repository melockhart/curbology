import { patch } from "../../../../lib/db";
import { adminOnly, backTo } from "../../../../lib/admin-action";

export async function POST(request: Request) {
  const auth = await adminOnly();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  if (!id) return new Response("Bad request", { status: 400 });

  const reply = String(form.get("owner_reply") ?? "").trim();
  await patch("reviews", id, {
    published: form.get("published") === "yes",
    owner_reply: reply || null,
    // Archived leaves the queue; it does not delete. There is no delete here on
    // purpose — choosing what the site shows is curation, making a review
    // disappear is not.
    status: form.get("archived") === "yes" ? "archived" : reply ? "replied" : "new",
  });
  return backTo(request, "/admin/reviews");
}
