import { patch } from "../../../../lib/db";
import { adminOnly, backTo } from "../../../../lib/admin-action";

const ALLOWED = ["new", "contacted", "quoted", "won", "lost", "spam"];

export async function POST(request: Request) {
  const auth = await adminOnly();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  // Validated against the list rather than passed through: the select is a
  // convenience, not a security boundary, and a POST does not have to come
  // from it.
  if (!id || !ALLOWED.includes(status)) return new Response("Bad request", { status: 400 });

  await patch("leads", id, { status });
  return backTo(request, "/admin/leads");
}
