import { handle, rpc } from "../../../../lib/admin-route";
import { ITEMS } from "../../../../lib/quote/pricing";
import { readRateCard } from "../../../../lib/quote/rules";

/** Tristen types dollars and percents. The card stores cents and basis points. */
const cents = (raw: FormDataEntryValue | null) => Math.round(Number(raw) * 100);
const bps = (raw: FormDataEntryValue | null) => Math.round(Number(raw) * 100);

export async function POST(request: Request) {
  return handle(request, "/admin/rates", async (form, session) => {
    const card = readRateCard({
      rates: Object.fromEntries(Object.keys(ITEMS).map((item) => [item, cents(form.get(`rate_${item}`))])),
      minimumCents: cents(form.get("minimum")),
      depositCents: cents(form.get("deposit")),
      maxAutoPriceCents: cents(form.get("max_auto")),
      heavySurchargeBps: bps(form.get("heavy")),
      secondStoreySurchargeBps: bps(form.get("storey")),
      multiServiceDiscountBps: bps(form.get("multi")),
      minConfidence: form.get("min_confidence"),
    });
    if ("error" in card) throw new Error(card.error);
    await rpc("quote_rates_save", { _card: card, _approve: form.get("intent") === "approve" }, session);
  });
}
