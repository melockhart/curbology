import assert from "node:assert/strict";
import { test } from "node:test";
import { DRAFT_RATE_CARD, priceQuote, type QuoteResult } from "./pricing.ts";
import { publicQuote, readGeocoderReply, readRateCard, readSubmission, sniffPhoto, type QuoteRow } from "./rules.ts";

const county = (GEOID: string) => ({
  result: { addressMatches: [{ matchedAddress: "1 MAIN ST", geographies: { Counties: [{ GEOID }] } }] },
});

test("Oakland County is inside and a neighbouring county is outside", () => {
  assert.equal(readGeocoderReply(county("26125")).area, "inside");
  assert.equal(readGeocoderReply(county("26163")).area, "outside");
});

test("an address the geocoder cannot match is unknown, not outside", () => {
  assert.equal(readGeocoderReply({ result: { addressMatches: [] } }).area, "unknown");
  assert.equal(readGeocoderReply(null).area, "unknown");
  assert.equal(readGeocoderReply({ errors: ["bad"] }).area, "unknown");
});

test("photos are judged by their bytes", () => {
  assert.equal(sniffPhoto(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mediaType, "image/jpeg");
  assert.equal(sniffPhoto(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mediaType, "image/png");
  assert.equal(
    sniffPhoto(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))?.mediaType,
    "image/webp",
  );
  assert.equal(sniffPhoto(new TextEncoder().encode("<svg onload=alert(1)>")), null);
  assert.equal(sniffPhoto(new Uint8Array([])), null);
});

const SUBMIT = {
  name: "Sam",
  email: "sam@example.com",
  items: [{ item: "flatwork", quantity: 800 }],
};

test("a good submission is read", () => {
  const result = readSubmission(SUBMIT);
  assert.ok(!("error" in result));
  assert.equal(result.items[0]?.quantity, 800);
  assert.equal(result.textConsent, false);
});

test("a browser cannot claim its size was measured", () => {
  const result = readSubmission({
    ...SUBMIT,
    items: [{ item: "flatwork", quantity: 800, source: "aerial" }],
  });
  assert.ok(!("error" in result));
  assert.equal(result.items[0]?.source, "customer");
});

test("a blank size means not sure, and reaches the owner", () => {
  const result = readSubmission({ ...SUBMIT, items: [{ item: "roof", quantity: "" }] });
  assert.ok(!("error" in result));
  assert.equal(result.items[0]?.quantity, null);
  const priced = priceQuote(
    { items: result.items, condition: "light", confidence: "high", stories: 1, flags: [], usablePhotos: 2 },
    { ...DRAFT_RATE_CARD, approvedAt: "2026-11-03" },
  );
  assert.equal(priced.outcome, "review");
  assert.ok(priced.reasons.includes("invalid_size"));
  assert.equal(priced.totalCents, null);
});

test("text consent needs a real yes", () => {
  for (const textConsent of ["true", 1, "on", {}]) {
    const result = readSubmission({ ...SUBMIT, textConsent });
    assert.ok(!("error" in result));
    assert.equal(result.textConsent, false);
  }
  const yes = readSubmission({ ...SUBMIT, textConsent: true });
  assert.ok(!("error" in yes) && yes.textConsent);
});

test("broken submissions are refused", () => {
  for (const body of [
    null,
    { ...SUBMIT, name: " " },
    { ...SUBMIT, email: "nope" },
    { ...SUBMIT, items: [] },
    { ...SUBMIT, items: [{ item: "helipad", quantity: 5 }] },
    { ...SUBMIT, items: [{ item: "constructor", quantity: 5 }] },
    { ...SUBMIT, items: [{ item: "flatwork", quantity: -5 }] },
    { ...SUBMIT, items: [{ item: "flatwork", quantity: "lots" }] },
  ]) {
    assert.ok("error" in readSubmission(body), JSON.stringify(body));
  }
});

test("a rate card is checked and approval cannot be smuggled in", () => {
  const good = readRateCard({ ...DRAFT_RATE_CARD, approvedAt: "2026-01-01" });
  assert.ok(!("error" in good));
  assert.ok(!("approvedAt" in good));
  assert.ok("error" in readRateCard({ ...DRAFT_RATE_CARD, minimumCents: -1 }));
  assert.ok("error" in readRateCard({ ...DRAFT_RATE_CARD, heavySurchargeBps: 20.5 }));
  assert.ok("error" in readRateCard({ ...DRAFT_RATE_CARD, minConfidence: "sure" }));
  assert.ok("error" in readRateCard({ ...DRAFT_RATE_CARD, rates: { ...DRAFT_RATE_CARD.rates, roof: 0 } }));
  assert.ok("error" in readRateCard(null));
});

const RESULT: QuoteResult = {
  outcome: "review",
  reasons: ["low_confidence"],
  lines: [
    { item: "flatwork", label: "Driveways and flatwork", quantity: 1000, unit: "sq ft", rateCents: 30, baseCents: 30000, surchargeCents: 0, totalCents: 30000 },
  ],
  subtotalCents: 30000,
  discountCents: 0,
  minimumApplied: false,
  totalCents: 30000,
  depositCents: 5000,
};
const ROW: QuoteRow = {
  id: "q1",
  status: "review",
  photo_paths: ["a"],
  result: RESULT,
  price_cents: null,
  deposit_cents: null,
  owner_note: "secret note",
};

test("a quote under review shows no money and no reasons", () => {
  for (const status of ["draft", "reading", "review", "declined", "outside"] as const) {
    const shown = JSON.stringify(publicQuote({ ...ROW, status, price_cents: 99900, photo_read: { summary: "private" } }));
    assert.ok(!shown.includes("private"), status);
    assert.ok(!shown.includes("30000"), status);
    assert.ok(!shown.includes("99900"), status);
    assert.ok(!shown.includes("low_confidence"), status);
    assert.ok(!shown.includes("secret note"), status);
  }
});

test("a priced quote shows its price and lines but no rate", () => {
  const shown = publicQuote({ ...ROW, status: "priced", price_cents: 30000, deposit_cents: 5000 });
  assert.ok("priceCents" in shown);
  assert.equal(shown.priceCents, 30000);
  assert.equal(shown.lines[0]?.totalCents, 30000);
  assert.ok(!JSON.stringify(shown).includes("rateCents"));
  const seen = publicQuote({ ...ROW, status: "priced", price_cents: 30000, photo_read: { summary: "Clean drive." } });
  assert.ok("seen" in seen && seen.seen === "Clean drive.");
});

test("a released quote shows the owner's price without the old lines", () => {
  const shown = publicQuote({ ...ROW, status: "released", price_cents: 28000, deposit_cents: 5000 });
  assert.ok("priceCents" in shown);
  assert.equal(shown.priceCents, 28000);
  assert.deepEqual(shown.lines, []);
  assert.equal(shown.note, "secret note");
});

test("a priced status with no price stays silent", () => {
  assert.ok(!("priceCents" in publicQuote({ ...ROW, status: "priced" })));
});
