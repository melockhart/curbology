import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/quotes", async (form, session) => {
    await rpc("quote_decline", { _id: String(form.get("id") ?? ""), _note: String(form.get("note") ?? "") }, session);
  });
}
