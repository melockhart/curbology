import type { Metadata } from "next";
import { configured } from "../../../lib/env";
import { previewMode, previewQuotes } from "../../../lib/preview";
import { listAllLeads, listReviews, type Review } from "../../../lib/db";
import { currentRateCard, listQuotes } from "../../../lib/quote/store";
import { AdminHeader, NotConfigured, Card, Stat, Pill, age } from "../../../components/admin/admin-ui";
import { A } from "../../../components/link";

export const metadata: Metadata = { title: "Today" };

type Waiting = { kind: string; who: string; what: string; at: string; href: string };
const DAY = 86_400_000;

/** Reviews with no reply yet. A low rating shows how long until it posts, under the 48-hour rule. */
function reviewsWaiting(reviews: Review[]): Waiting[] {
  const now = Date.now();
  return reviews
    .filter((r) => !r.owner_reply && r.status !== "archived" && r.status !== "flagged")
    .map((r) => {
      const posts = new Date(r.created_at).getTime() + 2 * DAY;
      const low = r.rating <= 2 && posts > now;
      return { kind: "Review", who: r.name, what: low ? `${r.rating} stars, posts in ${Math.max(1, Math.ceil((posts - now) / 36e5))}h` : `${r.rating} stars, no reply yet`, at: r.created_at, href: "/admin/reviews" };
    });
}

/**
 * What is waiting on Tristen, oldest first, in one list. The three counts above
 * it are the same items, so the page never disagrees with itself.
 */
export default async function Today() {
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader title="Today" /><NotConfigured /></div>;
  }

  const [quotes, leads, reviews, rates] = await Promise.all([
    previewMode() ? previewQuotes : listQuotes(),
    listAllLeads(),
    listReviews(),
    previewMode() ? null : currentRateCard().catch(() => null),
  ]);

  const quoteWaiting: Waiting[] = quotes
    .filter((q) => ["review", "reading", "outside"].includes(q.status))
    .map((q) => ({ kind: "Quote", who: q.name ?? "Customer", what: q.status === "outside" ? "Outside the area" : "Needs a price", at: q.created_at, href: `/admin/quotes?id=${q.id}` }));
  // Quote requests also create a lead. Counting both would show one customer twice.
  const quoteLeads = new Set(quotes.map((q) => q.email).filter(Boolean));
  const leadWaiting: Waiting[] = leads
    .filter((l) => l.status === "new" && !(l.source_page === "/quote" && quoteLeads.has(l.email)))
    .map((l) => ({ kind: "Message", who: l.name, what: l.service ?? "Contact form", at: l.created_at, href: "/admin/leads" }));
  const reviewWaiting = reviewsWaiting(reviews);
  const all = [...quoteWaiting, ...leadWaiting, ...reviewWaiting].sort((a, b) => a.at.localeCompare(b.at));
  const ratesApproved = previewMode() ? false : Boolean(rates?.card.approvedAt);

  return (
    <div className="space-y-6">
      <AdminHeader title="Today" intro="What is waiting on you, oldest first." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Quotes need you" value={quoteWaiting.length} />
        <Stat label="New messages" value={leadWaiting.length} />
        <Stat label="Reviews to answer" value={reviewWaiting.length} />
      </div>
      <Card title="Waiting on you" padded={all.length === 0}>
        {all.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">Nothing is waiting. New quotes, messages and reviews land here.</p>
        ) : (
          <ul className="divide-y divide-[color:var(--console-line)]">
            {all.map((item, index) => (
              <li key={`${item.href}-${index}`}>
                <A href={item.href} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-[#f1f4f6]">
                  <span className="min-w-0">
                    <span className="block font-medium">{item.who}</span>
                    <span className="block text-sm text-[color:var(--muted)]">{item.kind}: {item.what}</span>
                  </span>
                  <Pill tone="accent">{age(item.at)}</Pill>
                </A>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {!ratesApproved && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm"><strong className="font-semibold">Rates are not approved.</strong>{" "}
              <span className="text-[color:var(--muted)]">Every quote comes to you until they are.</span></p>
            <A href="/admin/rates" className="inline-flex min-h-[44px] items-center rounded-[12px] border border-[color:var(--console-line)] bg-white px-4 text-[15px] font-semibold hover:bg-[#f1f4f6]">Open rates</A>
          </div>
        </Card>
      )}
    </div>
  );
}
