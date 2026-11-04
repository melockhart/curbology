/**
 * The quote's rules that need no network: reading a geocoder answer, checking
 * uploaded bytes, validating what a browser sent, and deciding what a customer
 * may see. Separate from the routes so each can be tested on its own.
 */
import { ITEMS, type Confidence, type Item, type QuoteResult, type RateCard } from "./pricing.ts";

/* ------------------------------------------------------------- service area */

/** State and county FIPS codes. Oakland County, MI, as the captured site states. */
const SERVICE_COUNTIES = new Set(["26125"]);

export type AreaCheck = {
  area: "inside" | "outside" | "unknown";
  matchedAddress: string | null;
};

/**
 * Reads the US Census geocoder's reply. An address it cannot match is "unknown",
 * never "outside": a new street must reach the owner, not be turned away.
 */
export function readGeocoderReply(reply: unknown): AreaCheck {
  const match = (reply as { result?: { addressMatches?: unknown[] } })?.result?.addressMatches?.[0] as
    | { matchedAddress?: string; geographies?: { Counties?: { GEOID?: string }[] } }
    | undefined;
  const geoid = match?.geographies?.Counties?.[0]?.GEOID;
  if (!match || !geoid) return { area: "unknown", matchedAddress: match?.matchedAddress ?? null };
  return {
    area: SERVICE_COUNTIES.has(geoid) ? "inside" : "outside",
    matchedAddress: match.matchedAddress ?? null,
  };
}

/* ------------------------------------------------------------------- photos */

export const MAX_PHOTOS = 6;
/** Six of these stay under the model's 32 MB request limit once base64 encoded. */
export const MAX_PHOTO_BYTES = 3.5 * 1024 * 1024;

export type PhotoType = { mediaType: "image/jpeg" | "image/png" | "image/webp"; extension: string };

/** Decides by the file's bytes, because a browser's stated type is only a claim. */
export function sniffPhoto(bytes: Uint8Array): PhotoType | null {
  const at = (offset: number, ...expected: number[]) =>
    expected.every((value, index) => bytes[offset + index] === value);
  if (at(0, 0xff, 0xd8, 0xff)) return { mediaType: "image/jpeg", extension: "jpg" };
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mediaType: "image/png", extension: "png" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) {
    return { mediaType: "image/webp", extension: "webp" };
  }
  return null;
}

/* --------------------------------------------------------------- submission */

export const TEXT_CONSENT_WORDING =
  "Curbology may text me about this quote at the number above. Message and data rates may apply. Reply STOP to opt out.";

export type Submission = {
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  textConsent: boolean;
  /** Always "customer" here. Only a measuring service can mark a size as aerial. */
  items: { item: Item; quantity: number; source: "customer" }[];
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function readSubmission(body: unknown): Submission | { error: string } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const name = text(raw.name, 200);
  const email = text(raw.email, 320);
  if (!name) return { error: "Please add your name." };
  if (!EMAIL.test(email)) return { error: "Please check your email address." };

  if (!Array.isArray(raw.items) || raw.items.length === 0) return { error: "Please choose a service." };
  if (raw.items.length > 10) return { error: "That is too many services for one quote." };
  const items: Submission["items"] = [];
  for (const entry of raw.items as Record<string, unknown>[]) {
    const item = entry?.item;
    const quantity = Number(entry?.quantity);
    if (typeof item !== "string" || !Object.hasOwn(ITEMS, item)) return { error: "Please choose a service." };
    if (!Number.isFinite(quantity) || quantity <= 0) return { error: "Please check the size." };
    // The source is set here and never read from the request, so a browser
    // cannot claim its typed number was measured.
    items.push({ item: item as Item, quantity, source: "customer" });
  }

  return {
    name,
    email,
    phone: text(raw.phone, 40) || null,
    message: text(raw.message, 2000) || null,
    textConsent: raw.textConsent === true,
    items,
  };
}

/* ---------------------------------------------------------------- rate card */

const CONFIDENCES: Confidence[] = ["low", "medium", "high"];

export function readRateCard(raw: unknown): Omit<RateCard, "approvedAt"> | { error: string } {
  const card = (raw ?? {}) as Record<string, unknown>;
  const rates = (card.rates ?? {}) as Record<string, unknown>;
  const cents = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 100_000_000;
  const bps = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 10_000;

  for (const item of Object.keys(ITEMS)) {
    if (!cents(rates[item]) || rates[item] === 0) return { error: `The rate for ${item} is not a price.` };
  }
  for (const key of ["minimumCents", "depositCents", "maxAutoPriceCents"]) {
    if (!cents(card[key])) return { error: `${key} is not an amount.` };
  }
  for (const key of ["heavySurchargeBps", "secondStoreySurchargeBps", "multiServiceDiscountBps"]) {
    if (!bps(card[key])) return { error: `${key} is not a percentage.` };
  }
  if (!CONFIDENCES.includes(card.minConfidence as Confidence)) return { error: "minConfidence is not a level." };

  return {
    rates: Object.fromEntries(Object.keys(ITEMS).map((item) => [item, rates[item]])) as RateCard["rates"],
    minimumCents: card.minimumCents as number,
    depositCents: card.depositCents as number,
    heavySurchargeBps: card.heavySurchargeBps as number,
    secondStoreySurchargeBps: card.secondStoreySurchargeBps as number,
    multiServiceDiscountBps: card.multiServiceDiscountBps as number,
    minConfidence: card.minConfidence as Confidence,
    maxAutoPriceCents: card.maxAutoPriceCents as number,
  };
}

/* --------------------------------------------------------- the customer view */

export type QuoteRow = {
  id: string;
  status: "draft" | "reading" | "priced" | "review" | "released" | "declined" | "outside";
  photo_paths: string[];
  result: QuoteResult | null;
  price_cents: number | null;
  deposit_cents: number | null;
  owner_note: string | null;
};

/**
 * All a customer gets back. Built field by field from the status, so a stored
 * suggestion, the reader's notes or the reasons for a review cannot leak by a
 * later column being added to the row.
 */
export function publicQuote(row: QuoteRow) {
  const base = { id: row.id, status: row.status, photoCount: row.photo_paths.length };
  if ((row.status === "priced" || row.status === "released") && row.price_cents !== null) {
    return {
      ...base,
      priceCents: row.price_cents,
      depositCents: row.deposit_cents,
      // Released quotes may have moved away from the calculation, so its lines
      // would no longer add up to the price.
      lines:
        row.status === "priced"
          ? (row.result?.lines ?? []).map((line) => ({
              label: line.label,
              quantity: line.quantity,
              unit: line.unit,
              totalCents: line.totalCents,
            }))
          : [],
      note: row.status === "released" ? row.owner_note : null,
    };
  }
  return base;
}
