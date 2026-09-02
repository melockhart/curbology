import type { Metadata } from "next";
import { requireUser } from "../../../lib/guard";
import { configured } from "../../../lib/env";
import { listLeads, listReviews, listBookings } from "../../../lib/db";
import { AdminShell, NotConfigured, Empty, Pill, age } from "../../../components/admin";
import { A } from "../../../components/link";

export const metadata: Metadata = { title: "Today", robots: { index: false, follow: false } };

/**
 * "What needs me today", before anything offers a filter.
 *
 * Three queues, each showing only what is genuinely waiting on Tristen, oldest
 * first. If all three are empty the page says so plainly rather than rendering
 * three empty tables.
 */
export default async function AdminToday() {
  const user = await requireUser();
  if (!configured()) {
    return <AdminShell title="Today" user={user}><NotConfigured /></AdminShell>;
  }

  const [leads, reviews, bookings] = await Promise.all([listLeads(), listReviews(), listBookings()]);
  const newLeads = leads.filter((l) => l.status === "new");
  const newReviews = reviews.filter((r) => r.status === "new");
  const newBookings = bookings.filter((b) => b.state === "requested");
  const nothing = !newLeads.length && !newReviews.length && !newBookings.length;

  return (
    <AdminShell
      title="Today"
      intro={nothing ? undefined : "Oldest first. These are waiting on you."}
      user={user}
    >
      {nothing ? (
        <Empty>
          <p className="font-display text-xl text-ink">Nothing waiting</p>
          <p className="mt-2">No new quote requests, reviews or booking requests.</p>
        </Empty>
      ) : (
        <div className="space-y-10">
          {newLeads.length > 0 && (
            <Queue title="Quote requests" href="/admin/leads" count={newLeads.length}>
              {newLeads.slice(0, 5).map((l) => (
                <Row key={l.id} href="/admin/leads" primary={l.name}
                  secondary={[l.service, l.town ?? l.address].filter(Boolean).join(" · ")}
                  meta={age(l.created_at)} tone="new" />
              ))}
            </Queue>
          )}
          {newReviews.length > 0 && (
            <Queue title="Reviews" href="/admin/reviews" count={newReviews.length}>
              {newReviews.slice(0, 5).map((r) => (
                <Row key={r.id} href="/admin/reviews" primary={r.name}
                  secondary={`${r.rating}★ · ${r.body.slice(0, 60)}${r.body.length > 60 ? "…" : ""}`}
                  meta={age(r.created_at)} tone="new" />
              ))}
            </Queue>
          )}
          {newBookings.length > 0 && (
            <Queue title="Testimonial requests" href="/admin/bookings" count={newBookings.length}>
              {newBookings.slice(0, 5).map((b) => (
                <Row key={b.id} href="/admin/bookings" primary={b.name}
                  secondary={b.requested_slots ?? ""} meta={age(b.created_at)} tone="new" />
              ))}
            </Queue>
          )}
        </div>
      )}
    </AdminShell>
  );
}

function Queue({ title, href, count, children }: {
  title: string; href: string; count: number; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">
          {title} <span className="text-[color:var(--muted)]">({count})</span>
        </h2>
        <A href={href} className="text-sm underline underline-offset-4">See all</A>
      </div>
      <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-paper">{children}</ul>
    </section>
  );
}

function Row({ href, primary, secondary, meta, tone }: {
  href: string; primary: string; secondary: string; meta: string;
  tone: "new" | "live" | "done" | "muted";
}) {
  return (
    <li>
      <A href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-ink/[0.03]">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{primary}</span>
          {secondary && <span className="block truncate text-sm text-[color:var(--muted)]">{secondary}</span>}
        </span>
        <Pill tone={tone}>{meta}</Pill>
      </A>
    </li>
  );
}
