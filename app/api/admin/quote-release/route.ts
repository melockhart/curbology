import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/leads", async (form, session) => {
    const price = Number(form.get("price_cents"));
    const deposit = Number(form.get("deposit_cents"));
    if (!Number.isInteger(price) || price <= 0) throw new Error("That price is not a number");
    if (!Number.isInteger(deposit) || deposit < 0) throw new Error("That deposit is not a number");
    await rpc(
      "quote_release",
      { _id: String(form.get("id") ?? ""), _price_cents: price, _deposit_cents: deposit, _note: String(form.get("note") ?? "") },
      session,
    );
  });
}
