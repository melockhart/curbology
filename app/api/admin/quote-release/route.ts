import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/quotes", async (form, session) => {
    // Typed in dollars, stored in cents.
    const price = Math.round(Number(form.get("price")) * 100);
    const deposit = Math.round(Number(form.get("deposit")) * 100);
    if (!Number.isInteger(price) || price <= 0) throw new Error("That price is not a number");
    if (!Number.isInteger(deposit) || deposit < 0) throw new Error("That deposit is not a number");
    await rpc(
      "quote_release",
      { _id: String(form.get("id") ?? ""), _price_cents: price, _deposit_cents: deposit, _note: String(form.get("note") ?? "") },
      session,
    );
  });
}
