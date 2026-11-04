/**
 * The quote price. Plain arithmetic on a rate card, with no AI and no I/O.
 *
 * The model reads the photos; it never names a number. It reports a condition
 * and how sure it is, and this file turns that, the measured sizes and the
 * owner's rates into a price or a reason a person must look first. Keeping the
 * money here means a price can always be explained line by line, and a photo
 * cannot talk its way into a discount.
 *
 * Everything is integer cents and basis points, so totals never drift.
 */

export const ITEMS = {
  flatwork: { label: "Driveways and flatwork", unit: "sq ft", elevated: false },
  curb: { label: "Curb line", unit: "ft", elevated: false },
  siding: { label: "House and siding soft wash", unit: "sq ft", elevated: true },
  gutters: { label: "Gutters", unit: "ft", elevated: true },
  roof: { label: "Roof soft wash", unit: "sq ft", elevated: true },
} as const;

export type Item = keyof typeof ITEMS;
export type Condition = "light" | "moderate" | "heavy";
export type Confidence = "low" | "medium" | "high";

export type RateCard = {
  /** Cents per unit, keyed by item. */
  rates: Record<Item, number>;
  minimumCents: number;
  depositCents: number;
  heavySurchargeBps: number;
  secondStoreySurchargeBps: number;
  multiServiceDiscountBps: number;
  /** Anything below this goes to the owner before a price shows. */
  minConfidence: Confidence;
  /** Above this total the owner looks first, however sure the model is. */
  maxAutoPriceCents: number;
  /** When the owner approved these numbers. Null means no customer sees a price. */
  approvedAt: string | null;
};

/**
 * Starting numbers for the owner to replace. Nobody at Curbology has approved
 * them, which is why approvedAt is null: with this card every quote goes to the
 * owner, and the figures only ever appear to him as a suggestion.
 */
export const DRAFT_RATE_CARD: RateCard = {
  rates: { flatwork: 30, curb: 65, siding: 20, gutters: 150, roof: 45 },
  minimumCents: 15000,
  depositCents: 5000,
  heavySurchargeBps: 2000,
  secondStoreySurchargeBps: 2500,
  multiServiceDiscountBps: 1000,
  minConfidence: "medium",
  maxAutoPriceCents: 150000,
  approvedAt: null,
};

export type SizeSource = "aerial" | "customer";

export type QuoteInput = {
  items: { item: Item; quantity: number; source: SizeSource }[];
  condition: Condition | null;
  confidence: Confidence | null;
  stories: number | null;
  /** Things the photo reader thinks a person should see, such as damage. */
  flags: string[];
  usablePhotos: number;
};

export type StopReason =
  | "rates_not_approved"
  | "no_items"
  | "invalid_size"
  | "size_unverified"
  | "no_usable_photos"
  | "photos_not_read"
  | "low_confidence"
  | "flagged"
  | "big_price";

export type QuoteLine = {
  item: Item;
  label: string;
  quantity: number;
  unit: string;
  rateCents: number;
  baseCents: number;
  surchargeCents: number;
  totalCents: number;
};

export type QuoteResult = {
  /** "priced" is the only outcome a customer may see a number for. */
  outcome: "priced" | "review";
  reasons: StopReason[];
  lines: QuoteLine[];
  subtotalCents: number;
  discountCents: number;
  /** True when the minimum job price set the total. */
  minimumApplied: boolean;
  /** Null when the input was too broken to calculate anything. */
  totalCents: number | null;
  depositCents: number;
};

const CONFIDENCE_ORDER: Confidence[] = ["low", "medium", "high"];
const MAX_QUANTITY = 100_000;

/** A percentage of an amount, rounded to the nearest cent. */
function bpsOf(cents: number, bps: number): number {
  return Math.round((cents * bps) / 10_000);
}

export function priceQuote(input: QuoteInput, card: RateCard): QuoteResult {
  const reasons: StopReason[] = [];
  const stop = (reason: StopReason) => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };

  if (!card.approvedAt) stop("rates_not_approved");
  if (input.items.length === 0) stop("no_items");
  if (input.usablePhotos < 1) stop("no_usable_photos");
  if (!input.condition || !input.confidence) stop("photos_not_read");
  if (
    input.confidence &&
    CONFIDENCE_ORDER.indexOf(input.confidence) < CONFIDENCE_ORDER.indexOf(card.minConfidence)
  ) {
    stop("low_confidence");
  }
  if (input.flags.length > 0) stop("flagged");

  const valid = input.items.filter(
    (line) =>
      Object.hasOwn(ITEMS, line.item) &&
      Number.isFinite(line.quantity) &&
      line.quantity > 0 &&
      line.quantity <= MAX_QUANTITY,
  );
  if (valid.length !== input.items.length) stop("invalid_size");
  if (valid.some((line) => line.source !== "aerial")) stop("size_unverified");

  const heavy = input.condition === "heavy";
  const tall = (input.stories ?? 1) >= 2;

  const lines: QuoteLine[] = valid.map(({ item, quantity }) => {
    const rateCents = card.rates[item];
    const baseCents = Math.round(rateCents * quantity);
    const bps =
      (heavy ? card.heavySurchargeBps : 0) +
      (tall && ITEMS[item].elevated ? card.secondStoreySurchargeBps : 0);
    const surchargeCents = bpsOf(baseCents, bps);
    return {
      item,
      label: ITEMS[item].label,
      quantity,
      unit: ITEMS[item].unit,
      rateCents,
      baseCents,
      surchargeCents,
      totalCents: baseCents + surchargeCents,
    };
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  const distinctItems = new Set(lines.map((line) => line.item)).size;
  const discountCents = distinctItems >= 2 ? bpsOf(subtotalCents, card.multiServiceDiscountBps) : 0;
  const discounted = subtotalCents - discountCents;
  const minimumApplied = lines.length > 0 && discounted < card.minimumCents;
  const totalCents = lines.length === 0 ? null : Math.max(discounted, card.minimumCents);

  if (totalCents !== null && totalCents > card.maxAutoPriceCents) stop("big_price");

  return {
    outcome: reasons.length === 0 ? "priced" : "review",
    reasons,
    lines,
    subtotalCents,
    discountCents,
    minimumApplied,
    totalCents,
    depositCents: card.depositCents,
  };
}
