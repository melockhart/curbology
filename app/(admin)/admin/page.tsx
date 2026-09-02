import type { Metadata } from "next";
import { configured } from "../../../lib/env";
import { previewMode } from "../../../lib/preview";
import { listLeads, listReviews, listBookings } from "../../../lib/db";
import { AdminHeader, NotConfigured, Empty, Card, Stat, Pill, age } from "../../../components/admin/admin-ui";
import { A } from "../../../components/link";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * "What needs me today", before anything offers a filter.
 *
 * Three queues, each showing only what is genuinely waiting on Tristen, oldest
 * first. If all three are empty the page says so plainly rather than rendering
 * three empty tables.
 */
export default async function AdminDashboard() {
  if (!configured() && !previewMode()) {
    return (
      <div className="space-y-8">
        <AdminHeader eyebrow="Data" title="Dashboard" />
        <NotConfigured />
      </div>
    );
  }

  const [leads, reviews, bookings] = await Promise.all([listLeads(), listReviews(), listBookings()]);
  const newLeads = leads.filter((l) => l.status === "new");
  const newReviews = reviews.filter((r) => r.status === "new");
  const newBookings = bookings.filter((b) => b.state === "requested");
  const nothing = !newLeads.length && !newReviews.length && !newBookings.length;

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Data"
        title="Dashboard"
        intro={nothing ? undefined : "Oldest first. These are waiting on you."}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open quotes" value={leads.filter((l) => l.status !== "spam").length}
          hint={newLeads.length ? `${newLeads.length} not yet contacted` : "All contacted"} />
        <Stat label="Reviews live" value={reviews.filter((r) => r.published).length}
          hint={`${reviews.length} received`} />
        <Stat label="Testimonials" value={bookings.filter((b) => b.state === "received" || b.state === "published").length}
          hint={newBookings.length ? `${newBookings.length} waiting to be scheduled` : "Nothing waiting"} />
      </div>

      {nothing ? (
        <Empty>
          <p className="font-display text-xl text-ink">Nothing waiting</p>
          <p className="mt-2">No new quote requests, reviews or booking requests.</p>
        </Empty>
      ) : (
        <div className="space-y-6">
          {newLeads.length > 0 && (
            <Queue title="Quote requests" href="/admin/leads" count={newLeads.length}>
              {newLeads.slice(0, 5).map((l) => (
                <Row key={l.id} href="/admin/leads" primary={l.name}
                  secondary={[l.service, l.town ?? l.address].filter(Boolean).join(" · ")}
                  meta={age(l.created_at)} />
              ))}
            </Queue>
          )}
          {newReviews.length > 0 && (
            <Queue title="Reviews" href="/admin/reviews" count={newReviews.length}>
              {newReviews.slice(0, 5).map((r) => (
                <Row key={r.id} href="/admin/reviews" primary={r.name}
                  secondary={`${r.rating}★ · ${r.body.slice(0, 60)}${r.body.length > 60 ? "…" : ""}`}
                  meta={age(r.created_at)} />
              ))}
            </Queue>
          )}
          {newBookings.length > 0 && (
            <Queue title="Testimonial requests" href="/admin/bookings" count={newBookings.length}>
              {newBookings.slice(0, 5).map((b) => (
                <Row key={b.id} href="/admin/bookings" primary={b.name}
                  secondary={b.requested_slots ?? ""} meta={age(b.created_at)} />
              ))}
            </Queue>
          )}
        </div>
      )}
    </div>
  );
}

function Queue({ title, href, count, children }: {
  title: string; href: string; count: number; children: React.ReactNode;
}) {
  return (
    <Card padded={false}>
      <div className="flex items-baseline justify-between border-b border-[color:var(--console-line)] px-5 py-4">
        <h2 className="font-display text-base font-bold">
          {title} <span className="font-normal text-[color:var(--muted)]">({count})</span>
        </h2>
        <A href={href} className="text-sm underline underline-offset-4">See all</A>
      </div>
      <ul className="divide-y divide-[color:var(--console-line)]">{children}</ul>
    </Card>
  );
}

function Row({ href, primary, secondary, meta }: {
  href: string; primary: string; secondary: string; meta: string;
}) {
  return (
    <li>
      <A href={href} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ink/[0.03]">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{primary}</span>
          {secondary && <span className="block truncate text-sm text-[color:var(--muted)]">{secondary}</span>}
        </span>
        <Pill tone="accent">{meta}</Pill>
      </A>
    </li>
  );
}
