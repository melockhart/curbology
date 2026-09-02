import { handle, rpc } from "../../../../lib/admin-route";

const ALLOWED = ["new", "contacted", "quoted", "won", "lost", "spam"];

export async function POST(request: Request) {
  return handle(request, "/admin/leads", async (form, session) => {
    const id = String(form.get("id") ?? "");
    const status = String(form.get("status") ?? "");
    // Validated against the list rather than passed through: the select is a
    // convenience, not a security boundary, and a POST does not have to come
    // from it. The RPC checks it again for the same reason.
    if (!id || !ALLOWED.includes(status)) throw new Error("Unknown status");

    await rpc("lead_set_status", { _id: id, _status: status }, session);

    const raw = String(form.get("quoted_amount") ?? "").trim();
    if (raw !== "") {
      const amount = Number(raw);
      if (!Number.isFinite(amount) || amount < 0) throw new Error("That quote is not a number");
      await rpc("lead_set_quote", { _id: id, _amount: amount }, session);
    }
  });
}
