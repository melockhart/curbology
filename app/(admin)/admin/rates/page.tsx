import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { DRAFT_RATE_CARD, ITEMS, type Item, type RateCard } from "../../../../lib/quote/pricing";
import { currentRateCard } from "../../../../lib/quote/store";
import {
  AdminHeader, NotConfigured, NotWritable, Card, Button, Field, SaveBanner, fieldCls, when,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Rates" };

/**
 * Pricing guides found while designing this: search summaries of national
 * sources, with no Michigan data. A check on Tristen's numbers, never a source
 * of them.
 */
const GUIDES: Record<Item, string> = {
  flatwork: "$0.15 to $0.75 / sq ft",
  curb: "No benchmark found",
  siding: "$250 to $800 per house",
  gutters: "$150 to $350 per job",
  roof: "$0.30 to $0.75 / sq ft",
};

const dollars = (cents: number) => (cents / 100).toFixed(2);
const percent = (bps: number) => String(bps / 100);

export default async function RatesPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Rates" /><NotConfigured /></div>;
  }

  let card: RateCard = DRAFT_RATE_CARD;
  let loaded = true;
  if (!previewMode()) {
    try {
      ({ card } = await currentRateCard());
    } catch {
      loaded = false;
    }
  }

  return (
    <div className="space-y-8">
      <AdminHeader eyebrow="Work" title="Rates" intro="What the quote calculator prices with." />
      <SaveBanner state={s} message={m} />
      {!writable() && !previewMode() && <NotWritable />}

      {!loaded ? (
        <p role="alert" className="rounded-md border border-[#7a2e12] bg-[#7a2e12]/10 px-4 py-3 text-sm">
          The saved rates could not be read. Do not save over them until this clears.
        </p>
      ) : card.approvedAt ? (
        <p role="status" className="rounded-md border border-ink/20 bg-teal/15 px-4 py-3 text-sm">
          Approved {when(card.approvedAt)}. Customers can see prices from these numbers.
        </p>
      ) : (
        <p role="status" className="rounded-md border border-[#7a2e12] bg-[#7a2e12]/10 px-4 py-3 text-sm">
          Not approved. These are starting numbers for discussion, and no customer sees a price until you approve them.
          Every quote comes to you first.
        </p>
      )}

      <form action="/api/admin/quote-rates" method="post" className="space-y-6">
        <Card title="Rate card" padded={false}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--console-line)] text-left">
                  {["Surface", "Your rate ($)", "National guides"].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3"><span className="eyebrow">{h}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--console-line)]">
                {(Object.keys(ITEMS) as Item[]).map((item) => (
                  <tr key={item}>
                    <td className="px-5 py-3 font-medium"><label htmlFor={`r-${item}`}>{ITEMS[item].label}</label></td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <input id={`r-${item}`} name={`rate_${item}`} inputMode="decimal" required
                          defaultValue={dollars(card.rates[item])} style={{ width: "6rem" }} className={`${fieldCls} mt-0 tabular-nums`} />
                        <span className="whitespace-nowrap text-[color:var(--muted)]">/ {ITEMS[item].unit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-[color:var(--muted)]">{GUIDES[item]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Rules">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Minimum job ($)" htmlFor="r-min">
              <input id="r-min" name="minimum" inputMode="decimal" required defaultValue={dollars(card.minimumCents)} className={fieldCls} />
            </Field>
            <Field label="Deposit ($)" htmlFor="r-dep">
              <input id="r-dep" name="deposit" inputMode="decimal" required defaultValue={dollars(card.depositCents)} className={fieldCls} />
            </Field>
            <Field label="Check it myself above ($)" htmlFor="r-max">
              <input id="r-max" name="max_auto" inputMode="decimal" required defaultValue={dollars(card.maxAutoPriceCents)} className={fieldCls} />
            </Field>
            <Field label="Heavy staining adds (%)" htmlFor="r-heavy">
              <input id="r-heavy" name="heavy" inputMode="decimal" required defaultValue={percent(card.heavySurchargeBps)} className={fieldCls} />
            </Field>
            <Field label="Second storey adds (%)" htmlFor="r-storey">
              <input id="r-storey" name="storey" inputMode="decimal" required defaultValue={percent(card.secondStoreySurchargeBps)} className={fieldCls} />
            </Field>
            <Field label="Two or more services take off (%)" htmlFor="r-multi">
              <input id="r-multi" name="multi" inputMode="decimal" required defaultValue={percent(card.multiServiceDiscountBps)} className={fieldCls} />
            </Field>
            <Field label="Send to me below" htmlFor="r-conf">
              <select id="r-conf" name="min_confidence" defaultValue={card.minConfidence} className={fieldCls}>
                <option value="low">Low confidence</option>
                <option value="medium">Medium confidence</option>
                <option value="high">High confidence</option>
              </select>
            </Field>
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button name="intent" value="save">Save without approving</Button>
          <Button weight="loud" name="intent" value="approve">Approve these rates</Button>
        </div>
        <p className="text-sm text-[color:var(--muted)]">
          Any change needs approving again. Saving without approving stops instant prices until you do.
        </p>
      </form>
    </div>
  );
}
