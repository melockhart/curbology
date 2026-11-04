import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode, previewQuotes } from "../../../../lib/preview";
import { ITEMS, type Item, type StopReason } from "../../../../lib/quote/pricing";
import { listQuotes, type ConsoleQuote } from "../../../../lib/quote/store";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button, Field, SaveBanner, age, fieldCls,
} from "../../../../components/admin/admin-ui";
import { A } from "../../../../components/link";

export const metadata: Metadata = { title: "Quotes" };

/** Why a quote stopped, in the words Tristen needs. Every reason the calculator can give is here. */
const REASONS: Record<StopReason, string> = {
  rates_not_approved: "Rates are not approved yet, so no customer can see a price.",
  no_items: "No service was chosen.",
  invalid_size: "The customer did not know a size, or gave one that cannot be right.",
  size_unverified: "The size is the customer's own number. Nothing has measured it.",
  no_usable_photos: "No photo clearly shows the job.",
  photos_not_read: "The photos could not be read automatically.",
  low_confidence: "The photo reader was not sure of the condition.",
  flagged: "The photo reader flagged something for you to see.",
  big_price: "The price is over your limit for automatic quotes.",
};

const dollars = (cents: number | null | undefined) => (cents === null || cents === undefined ? "" : (cents / 100).toFixed(2));
const WAITING = ["review", "reading", "outside"];
const STATUS: Record<string, { label: string; tone: "accent" | "muted" | "default" }> = {
  review: { label: "Needs you", tone: "accent" },
  reading: { label: "Needs you", tone: "accent" },
  outside: { label: "Outside the area", tone: "accent" },
  priced: { label: "Price shown", tone: "default" },
  released: { label: "You set the price", tone: "default" },
  declined: { label: "Declined", tone: "muted" },
};

/**
 * What the calculator priced, and what is still waiting on Tristen. Waiting
 * quotes come first, oldest first, because the oldest one costs the most.
 */
export default async function QuotesPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string; id?: string }> }) {
  const { s, m, id } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Quotes" /><NotConfigured /></div>;
  }

  const quotes = previewMode() ? previewQuotes : await listQuotes();
  const waiting = quotes.filter((q) => WAITING.includes(q.status)).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const rest = quotes.filter((q) => !WAITING.includes(q.status));
  const ordered = [...waiting, ...rest];
  const open = ordered.find((q) => q.id === id) ?? ordered[0];

  return (
    <div className="space-y-8">
      <AdminHeader eyebrow="Work" title="Quotes" intro="What the calculator priced, and what still needs you." />
      <SaveBanner state={s} message={m} />
      {!writable() && !previewMode() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Quotes" value={quotes.length} />
        <Stat label="Need you" value={waiting.length} />
        <Stat label="Price shown" value={quotes.filter((q) => q.status === "priced" || q.status === "released").length} />
      </div>

      {quotes.length === 0 ? (
        <Empty>No quotes yet. They arrive here the moment someone finishes the quote form.</Empty>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[5fr_6fr]">
          <Card padded={false}>
            <ul className="divide-y divide-[color:var(--console-line)]">
              {ordered.map((quote) => {
                const status = STATUS[quote.status] ?? { label: quote.status, tone: "muted" as const };
                return (
                  <li key={quote.id}>
                    <A href={`/admin/quotes?id=${quote.id}`}
                      className={`flex items-start justify-between gap-4 px-5 py-4 hover:bg-ink/5 ${quote.id === open?.id ? "bg-ink/5" : ""}`}>
                      <span className="min-w-0">
                        <span className="block font-medium">{quote.name}</span>
                        <span className="block text-sm text-[color:var(--muted)]">{jobOf(quote)}</span>
                        <span className="mt-2 block"><Pill tone={status.tone}>{status.label}</Pill></span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-medium tabular-nums">
                          {quote.price_cents !== null ? `$${dollars(quote.price_cents)}` : "No price"}
                        </span>
                        <span className="block text-sm text-[color:var(--muted)]">{age(quote.created_at)}</span>
                      </span>
                    </A>
                  </li>
                );
              })}
            </ul>
          </Card>
          {open && <Detail quote={open} />}
        </div>
      )}
    </div>
  );
}

function jobOf(quote: ConsoleQuote): string {
  const names = quote.items.map((line) => ITEMS[line.item as Item]?.label ?? line.item);
  return names.join(", ") || "No service chosen";
}

function Detail({ quote }: { quote: ConsoleQuote }) {
  const read = quote.photo_read;
  const reasons = quote.result?.reasons ?? [];
  const waiting = WAITING.includes(quote.status);

  return (
    <Card>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-medium">{quote.name}</h2>
          <p className="text-sm text-[color:var(--muted)]">{quote.matched_address ?? quote.address}</p>
          <p className="mt-1 text-sm">
            {quote.email && <a className="underline underline-offset-4" href={`mailto:${quote.email}`}>{quote.email}</a>}
            {quote.phone && <> · <a className="whitespace-nowrap underline underline-offset-4" href={`tel:${quote.phone}`}>{quote.phone}</a></>}
          </p>
        </div>

        {quote.photo_paths.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {quote.photo_paths.map((path) => (
              <a key={path} href={`/api/admin/quote-photo?path=${encodeURIComponent(path)}`} target="_blank" rel="noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element -- private bytes behind a signed-in route */}
                <img src={`/api/admin/quote-photo?path=${encodeURIComponent(path)}`} alt="Customer's photo"
                  className="h-24 w-full rounded-md object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--muted)]">No photos were added.</p>
        )}

        <table className="w-full text-sm">
          <tbody className="divide-y divide-[color:var(--console-line)]">
            {quote.items.map((line, index) => (
              <tr key={`${line.item}-${index}`}>
                <td className="py-2">{ITEMS[line.item as Item]?.label ?? line.item}</td>
                <td className="py-2 text-right tabular-nums">
                  {line.quantity === null ? "Size not given" : `${line.quantity.toLocaleString("en-US")} ${ITEMS[line.item as Item]?.unit ?? ""}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {quote.message && <p className="text-sm"><span className="font-medium">Customer says: </span>{quote.message}</p>}

        {read && !read.error ? (
          <div className="text-sm">
            <p className="font-medium">Photo reader: {read.condition} condition, {read.confidence} confidence{read.stories ? `, ${read.stories} storey` : ""}</p>
            {read.summary && <p className="mt-1 text-[color:var(--muted)]">{read.summary}</p>}
            {(read.flags ?? []).map((flag) => <p key={flag} className="mt-1">Flag: {flag}</p>)}
          </div>
        ) : (
          <p className="text-sm text-[color:var(--muted)]">The photos were not read automatically.</p>
        )}

        {reasons.length > 0 && (
          <div className="border-l-[3px] border-ink/40 pl-4 text-sm">
            <p className="font-medium">Why it stopped</p>
            {reasons.map((reason) => <p key={reason} className="mt-1">{REASONS[reason] ?? reason}</p>)}
          </div>
        )}

        {waiting ? (
          <>
            <form action="/api/admin/quote-release" method="post" className="space-y-4">
              <input type="hidden" name="id" value={quote.id} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your price ($)" htmlFor="q-price"
                  hint={quote.result?.totalCents ? `Calculator suggests $${dollars(quote.result.totalCents)}` : "Calculator has no suggestion"}>
                  <input id="q-price" name="price" inputMode="decimal" required className={fieldCls}
                    defaultValue={dollars(quote.result?.totalCents)} />
                </Field>
                <Field label="Deposit ($)" htmlFor="q-deposit" hint="From your rate card">
                  <input id="q-deposit" name="deposit" inputMode="decimal" required className={fieldCls}
                    defaultValue={dollars(quote.result?.depositCents)} />
                </Field>
              </div>
              <Field label="Note to customer" htmlFor="q-note" hint="Shown with the price, on this customer's quote page.">
                <textarea id="q-note" name="note" rows={2} className={fieldCls} />
              </Field>
              <Button weight="loud">Set this price</Button>
            </form>
            <form action="/api/admin/quote-decline" method="post">
              <input type="hidden" name="id" value={quote.id} />
              <Button>Decline this job</Button>
            </form>
            <p className="text-sm text-[color:var(--muted)]">
              The customer is not told automatically yet. Call or email them when you set a price.
            </p>
          </>
        ) : (
          quote.owner_note && <p className="text-sm"><span className="font-medium">Your note: </span>{quote.owner_note}</p>
        )}
      </div>
    </Card>
  );
}
