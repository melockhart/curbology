import { handle, rpc } from "../../../../lib/admin-route";
import { readRateCard } from "../../../../lib/quote/rules";

export async function POST(request: Request) {
  return handle(request, "/admin/leads", async (form, session) => {
    let raw: unknown;
    try {
      raw = JSON.parse(String(form.get("card") ?? ""));
    } catch {
      throw new Error("That rate card could not be read");
    }
    const card = readRateCard(raw);
    if ("error" in card) throw new Error(card.error);
    await rpc("quote_rates_save", { _card: card, _approve: form.get("approve") === "1" }, session);
  });
}
