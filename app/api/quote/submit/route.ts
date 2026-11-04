import { notReady, quoteToken, reply } from "../../../../lib/quote/http";
import { ITEMS, priceQuote, type Condition, type Confidence, type RateCard } from "../../../../lib/quote/pricing";
import { publicQuote, readSubmission, sniffPhoto, TEXT_CONSENT_WORDING } from "../../../../lib/quote/rules";
import {
  claimForReading,
  createLead,
  currentRateCard,
  fetchPhoto,
  loadQuote,
  saveOutcome,
  underReadLimit,
  updateLead,
} from "../../../../lib/quote/store";
import { readPhotos, type PhotoInput, type PhotoRead, type PhotoReadFailure } from "../../../../lib/quote/vision";

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function loadPhotos(paths: string[]): Promise<PhotoInput[]> {
  const loaded = await Promise.all(paths.map(fetchPhoto));
  return loaded.flatMap((bytes) => {
    const type = bytes && sniffPhoto(bytes);
    return bytes && type ? [{ bytes, mediaType: type.mediaType }] : [];
  });
}

/**
 * The last step. Contact details are saved before anything that can fail or
 * cost money, so a customer who reaches this point always reaches the owner.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const submission = readSubmission(await request.json().catch(() => null));
  if ("error" in submission) return reply({ error: submission.error }, 400);

  let quote;
  try {
    const found = await loadQuote(id, quoteToken(request));
    if (!found) return reply({ error: "No such quote." }, 404);
    if (found.status !== "draft") return reply(publicQuote(found));

    quote = await claimForReading(found.id, {
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      message: submission.message,
      text_consent: submission.textConsent,
      text_consent_wording: submission.textConsent ? TEXT_CONSENT_WORDING : null,
      items: submission.items,
    });
    // Another request claimed it first. Answer with where that one has got to.
    if (!quote) return reply(publicQuote(found));
  } catch (error) {
    console.error("quote submit failed", error instanceof Error ? error.message : "unknown error");
    return reply({ error: "That did not save. Please try again." }, 500);
  }

  // From here the contact is safe, so a failure means the owner prices it by hand.
  const services = submission.items.map((line) => ITEMS[line.item].label);
  let leadId: string | null = null;
  try {
    leadId = await createLead({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      address: quote.matched_address ?? quote.address,
      service: quote.service ?? services.join(", "),
      message: submission.message,
      photo_paths: quote.photo_paths,
      source_page: "/quote",
    });

    if (quote.area === "outside") {
      quote = await saveOutcome(quote.id, { status: "outside", lead_id: leadId });
      await updateLead(leadId, { notes: "Instant quote: address is outside the service area." });
      return reply(publicQuote(quote));
    }

    const { id: rateCardId, card } = await currentRateCard();
    const outcome: PhotoRead | PhotoReadFailure = (await underReadLimit())
      ? await readPhotos(await loadPhotos(quote.photo_paths), services)
      : { error: "daily_limit" };
    const read: PhotoRead | null = "error" in outcome ? null : outcome;

    const result = priceQuote(
      {
        items: submission.items,
        condition: (read?.condition ?? null) as Condition | null,
        confidence: (read?.confidence ?? null) as Confidence | null,
        stories: read?.stories ?? null,
        flags: [...(read?.flags ?? []), ...(quote.area === "unknown" ? ["Address could not be confirmed"] : [])],
        usablePhotos: read?.usable_photos ?? 0,
      },
      card as RateCard,
    );
    const priced = result.outcome === "priced" && result.totalCents !== null;

    quote = await saveOutcome(quote.id, {
      status: priced ? "priced" : "review",
      photo_read: outcome,
      result,
      rate_card_id: rateCardId,
      lead_id: leadId,
      price_cents: priced ? result.totalCents : null,
      deposit_cents: priced ? result.depositCents : null,
    });

    const suggestion = result.totalCents === null ? "No suggested price." : `Suggested ${dollars(result.totalCents)}.`;
    await updateLead(
      leadId,
      priced
        ? { status: "quoted", quoted_amount: result.totalCents! / 100, notes: "Instant quote shown to the customer." }
        : { notes: `Instant quote needs a decision (${result.reasons.join(", ")}). ${suggestion}` },
    );
    return reply(publicQuote(quote));
  } catch (error) {
    console.error("quote pricing failed", error instanceof Error ? error.message : "unknown error");
    try {
      quote = await saveOutcome(quote.id, { status: "review", lead_id: leadId });
    } catch {
      // Still "reading", which the owner can also act on. The contact is saved.
    }
    return reply(publicQuote({ ...quote, status: "review", price_cents: null }));
  }
}
