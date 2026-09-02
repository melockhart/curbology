import type { Metadata } from "next";
import { configured } from "../../../../lib/env";
import { listAllLeads, listReviews, listBookings, type Lead } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, Empty, Card, Stat, Pill,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Analytics" };

/**
 * Where the work comes from.
 *
 * Everything on this page is computed from Curbology's own tables — no
 * third-party analytics, no tag, no cookie banner earned. That is a real limit
 * and it is stated on the page rather than hidden: this measures enquiries, not
 * visits, so it can tell you which service people ask for and which page they
 * asked from, and it cannot tell you how many people looked and left.
 *
 * Marked beta because the second half of that sentence is worth closing later.
 */
const DAY = 86_400_000;

export default async function AnalyticsPage() {
  if (!configured()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Data" title="Analytics" /><NotConfigured /></div>;
  }

  const [leads, reviews, bookings] = await Promise.all([listAllLeads(), listReviews(), listBookings()]);
  const real = leads.filter((l) => l.status !== "spam");

  const { last30, prev30 } = windows(real);
  const won = real.filter((l) => l.status === "won");
  const closed = real.filter((l) => l.status === "won" || l.status === "lost");
  const winRate = closed.length ? Math.round((won.length / closed.length) * 100) : null;
  const responseHours = medianResponse(real);

  if (real.length === 0) {
    return (
      <div className="space-y-8">
        <AdminHeader eyebrow="Data" title="Analytics"
          intro="Measured from enquiries, not page views. Nothing here needs a tracking script." />
        <Empty>Nothing to measure yet. The first quote request starts this page.</Empty>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Data"
        title="Analytics"
        intro="Counted from your own tables — enquiries, not page views. It can tell you what people ask for and where they asked from; it cannot tell you how many looked and left."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Enquiries · 30 days" value={last30.length}
          hint={prev30.length ? `${delta(last30.length, prev30.length)} vs the 30 before` : "First month"} />
        <Stat label="Win rate" value={winRate === null ? "—" : `${winRate}%`}
          hint={closed.length ? `${won.length} of ${closed.length} closed` : "Nothing closed yet"} />
        <Stat label="Median reply" value={responseHours === null ? "—" : `${responseHours}h`}
          hint={responseHours === null ? "Nothing contacted yet" : "Arrival to first status change"} />
        <Stat label="Reviews · testimonials" value={`${reviews.length} · ${bookings.length}`}
          hint={`${reviews.filter((r) => r.published).length} on the site`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Service asked for" rows={tally(real, (l) => l.service ?? "Not stated")} total={real.length} />
        <Breakdown title="Page they asked from" rows={tally(real, (l) => l.source_page ?? "Not recorded")}
          total={real.length}
          hint="Recorded by the form, so it is where they submitted — not where they landed." />
        <Breakdown title="Town" rows={tally(real, (l) => l.town ?? l.address ?? "Not stated")} total={real.length} />
      </div>
    </div>
  );
}

/**
 * The two month-long windows, computed outside the component.
 *
 * `Date.now()` in a render body is an impure read: two renders of the same data
 * can disagree, which is exactly what a server render and a hydration are.
 */
function windows<T extends { created_at: string }>(rows: T[]): { last30: T[]; prev30: T[] } {
  const now = Date.now();
  const aged = (row: T) => now - new Date(row.created_at).getTime();
  return {
    last30: rows.filter((r) => aged(r) < 30 * DAY),
    prev30: rows.filter((r) => aged(r) >= 30 * DAY && aged(r) < 60 * DAY),
  };
}

function delta(now: number, before: number): string {
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

function tally<T>(rows: T[], key: (row: T) => string): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/**
 * Median, not mean: one lead left over a holiday weekend drags a mean into
 * uselessness, and the number is only worth showing if it describes a typical
 * day rather than the worst one.
 */
function medianResponse(leads: Lead[]): number | null {
  const hours = leads
    .filter((l) => l.status !== "new" && l.updated_at)
    .map((l) => (new Date(l.updated_at!).getTime() - new Date(l.created_at).getTime()) / 36e5)
    .filter((h) => h >= 0)
    .sort((a, b) => a - b);
  if (hours.length === 0) return null;
  const mid = Math.floor(hours.length / 2);
  return Math.round(hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2);
}

function Breakdown({ title, rows, total, hint }: {
  title: string; rows: Array<[string, number]>; total: number; hint?: string;
}) {
  return (
    <Card title={title} hint={hint} padded={false}>
      <ul className="divide-y divide-[color:var(--console-line)]">
        {rows.slice(0, 8).map(([label, count]) => (
          <li key={label} className="px-5 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm">{label}</span>
              <Pill tone="muted">{count}</Pill>
            </div>
            {/* Decoration for the number beside it, not the datum. */}
            <div aria-hidden="true" className="mt-2 h-1 rounded-full bg-ink/[0.07]">
              <div className="h-1 rounded-full bg-teal" style={{ width: `${(count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
