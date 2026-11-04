import assert from "node:assert/strict";
import { test } from "node:test";
import { DRAFT_RATE_CARD, priceQuote, type QuoteInput, type RateCard } from "./pricing.ts";

const CARD: RateCard = { ...DRAFT_RATE_CARD, approvedAt: "2026-11-03T00:00:00Z" };

const GOOD: QuoteInput = {
  items: [{ item: "flatwork", quantity: 1000, source: "aerial" }],
  condition: "moderate",
  confidence: "high",
  stories: 1,
  flags: [],
  usablePhotos: 3,
};

test("prices a clean job from rate times size", () => {
  const result = priceQuote(GOOD, CARD);
  assert.equal(result.outcome, "priced");
  assert.deepEqual(result.reasons, []);
  assert.equal(result.totalCents, 30000);
});

test("draft rates never reach a customer, however sure the model is", () => {
  const result = priceQuote(GOOD, DRAFT_RATE_CARD);
  assert.equal(result.outcome, "review");
  assert.deepEqual(result.reasons, ["rates_not_approved"]);
  assert.equal(result.totalCents, 30000, "the owner still sees the suggestion");
});

test("low confidence goes to the owner; medium does not", () => {
  assert.ok(priceQuote({ ...GOOD, confidence: "low" }, CARD).reasons.includes("low_confidence"));
  assert.equal(priceQuote({ ...GOOD, confidence: "medium" }, CARD).outcome, "priced");
});

test("a failed photo read goes to the owner rather than guessing", () => {
  const result = priceQuote({ ...GOOD, condition: null, confidence: null }, CARD);
  assert.equal(result.outcome, "review");
  assert.ok(result.reasons.includes("photos_not_read"));
});

test("no usable photos goes to the owner", () => {
  assert.ok(priceQuote({ ...GOOD, usablePhotos: 0 }, CARD).reasons.includes("no_usable_photos"));
});

test("anything the photo reader flags goes to the owner", () => {
  const result = priceQuote({ ...GOOD, flags: ["cracked concrete"] }, CARD);
  assert.deepEqual(result.reasons, ["flagged"]);
});

test("a size the customer typed is not trusted on its own", () => {
  const result = priceQuote(
    { ...GOOD, items: [{ item: "flatwork", quantity: 1000, source: "customer" }] },
    CARD,
  );
  assert.deepEqual(result.reasons, ["size_unverified"]);
});

test("a big price goes to the owner", () => {
  const result = priceQuote(
    { ...GOOD, items: [{ item: "flatwork", quantity: 6000, source: "aerial" }] },
    CARD,
  );
  assert.equal(result.totalCents, 180000);
  assert.deepEqual(result.reasons, ["big_price"]);
});

test("the big price limit itself is still automatic", () => {
  const result = priceQuote(
    { ...GOOD, items: [{ item: "flatwork", quantity: 5000, source: "aerial" }] },
    CARD,
  );
  assert.equal(result.totalCents, CARD.maxAutoPriceCents);
  assert.equal(result.outcome, "priced");
});

test("the minimum sets the floor and says so", () => {
  const result = priceQuote(
    { ...GOOD, items: [{ item: "curb", quantity: 10, source: "aerial" }] },
    CARD,
  );
  assert.equal(result.totalCents, CARD.minimumCents);
  assert.equal(result.minimumApplied, true);
  assert.equal(result.subtotalCents, 650);
});

test("heavy staining adds its surcharge to every line", () => {
  const result = priceQuote({ ...GOOD, condition: "heavy" }, CARD);
  assert.equal(result.lines[0]?.surchargeCents, 6000);
  assert.equal(result.totalCents, 36000);
});

test("a second storey raises elevated work only", () => {
  const result = priceQuote(
    {
      ...GOOD,
      stories: 2,
      items: [
        { item: "flatwork", quantity: 1000, source: "aerial" },
        { item: "gutters", quantity: 200, source: "aerial" },
      ],
    },
    CARD,
  );
  assert.equal(result.lines[0]?.surchargeCents, 0);
  assert.equal(result.lines[1]?.surchargeCents, 7500);
});

test("heavy and second storey add together rather than compound", () => {
  const result = priceQuote(
    {
      ...GOOD,
      condition: "heavy",
      stories: 2,
      items: [{ item: "gutters", quantity: 200, source: "aerial" }],
    },
    CARD,
  );
  assert.equal(result.lines[0]?.surchargeCents, 13500);
});

test("the bundle discount needs two different services", () => {
  const same = priceQuote(
    {
      ...GOOD,
      items: [
        { item: "flatwork", quantity: 1000, source: "aerial" },
        { item: "flatwork", quantity: 500, source: "aerial" },
      ],
    },
    CARD,
  );
  assert.equal(same.discountCents, 0);

  const two = priceQuote(
    {
      ...GOOD,
      items: [
        { item: "flatwork", quantity: 1000, source: "aerial" },
        { item: "curb", quantity: 100, source: "aerial" },
      ],
    },
    CARD,
  );
  assert.equal(two.subtotalCents, 36500);
  assert.equal(two.discountCents, 3650);
  assert.equal(two.totalCents, 32850);
});

test("the minimum applies after the discount", () => {
  const result = priceQuote(
    {
      ...GOOD,
      items: [
        { item: "flatwork", quantity: 300, source: "aerial" },
        { item: "curb", quantity: 100, source: "aerial" },
      ],
    },
    CARD,
  );
  assert.equal(result.subtotalCents, 15500);
  assert.equal(result.totalCents, CARD.minimumCents);
  assert.equal(result.minimumApplied, true);
});

for (const quantity of [0, -50, Number.NaN, Number.POSITIVE_INFINITY, 1_000_000]) {
  test(`a size of ${quantity} goes to the owner and is not priced`, () => {
    const result = priceQuote(
      { ...GOOD, items: [{ item: "flatwork", quantity, source: "aerial" }] },
      CARD,
    );
    assert.equal(result.outcome, "review");
    assert.ok(result.reasons.includes("invalid_size"));
    assert.equal(result.lines.length, 0);
    assert.equal(result.totalCents, null);
  });
}

test("an item that is not on the card goes to the owner", () => {
  for (const item of ["helipad", "constructor", "toString"]) {
    const result = priceQuote(
      { ...GOOD, items: [{ item: item as "curb", quantity: 10, source: "aerial" }] },
      CARD,
    );
    assert.ok(result.reasons.includes("invalid_size"), item);
    assert.equal(result.totalCents, null, item);
  }
});

test("no items goes to the owner", () => {
  const result = priceQuote({ ...GOOD, items: [] }, CARD);
  assert.ok(result.reasons.includes("no_items"));
  assert.equal(result.totalCents, null);
});
