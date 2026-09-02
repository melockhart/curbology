import type { Metadata } from "next";
import { configured } from "../../../../lib/env";
import { listAllLeads, listReviews, listBookings } from "../../../../lib/db";
import { AdminHeader, NotConfigured, Card, Pill, Code, age } from "../../../../components/admin/admin-ui";
import { A } from "../../../../components/link";

export const metadata: Metadata = { title: "Forms" };

/**
 * Every form on the site, what it collects, and where what it collects goes.
 *
 * Read-only on purpose. A form builder would let someone add a field that
 * nothing stores and no screen shows, and the first time that happens it is a
 * customer's answer that quietly disappears. Fields live in the code beside the
 * table that holds them; this screen exists so you can see the whole chain
 * without reading either.
 */
type FormSpec = {
  name: string;
  where: string;
  page: string;
  endpoint: string;
  table: string;
  screen: string;
  fields: string[];
  guard: string;
};

const FORMS: FormSpec[] = [
  {
    name: "Quote request",
    where: "Contact page, and the call-to-action on every service page",
    page: "/contact",
    endpoint: "/api/leads",
    table: "leads",
    screen: "/admin/leads",
    fields: ["name", "email", "phone", "address", "town", "service", "message"],
    guard: "Status is set to “new” by the server. A submitter cannot choose it.",
  },
  {
    name: "Review",
    where: "The review portal",
    page: "/review",
    endpoint: "/api/reviews",
    table: "reviews",
    screen: "/admin/reviews",
    fields: ["name", "email", "rating", "service", "body", "consent to publish"],
    guard:
      "Every rating takes the same path — no routing by sentiment. `published` is false " +
      "on arrival and only the Reviews screen can change it.",
  },
  {
    name: "Testimonial booking",
    where: "The testimonial portal",
    page: "/testimonial",
    endpoint: "/api/bookings",
    table: "bookings",
    screen: "/admin/bookings",
    fields: ["name", "email", "phone", "format", "when suits them"],
    guard: "State starts at “requested”. Confirming is yours to do.",
  },
  {
    name: "Unsubscribe",
    where: "The footer of every commercial email",
    page: "/email-unsubscribe",
    endpoint: "/api/unsubscribe",
    table: "unsubscribes",
    screen: "—",
    fields: ["contact id", "reason"],
    guard:
      "POST only. Rendering the page never writes: security scanners fetch every URL in a " +
      "message before it is delivered, and a GET that suppressed would unsubscribe people " +
      "who never clicked.",
  },
];

export default async function FormsPage() {
  if (!configured()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Marketing" title="Forms" /><NotConfigured /></div>;
  }

  const [leads, reviews, bookings] = await Promise.all([listAllLeads(), listReviews(), listBookings()]);
  const counts: Record<string, { total: number; latest?: string }> = {
    leads: { total: leads.length, latest: leads[0]?.created_at },
    reviews: { total: reviews.length, latest: reviews[0]?.created_at },
    bookings: { total: bookings.length, latest: bookings[0]?.created_at },
    unsubscribes: { total: 0 },
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Marketing"
        title="Forms"
        intro="What the site asks for, where each answer lands, and the rule that keeps a submitter from setting a field they should not."
      />

      <div className="space-y-4">
        {FORMS.map((f) => {
          const stat = counts[f.table];
          return (
            <Card key={f.name}>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-lg font-bold">{f.name}</h2>
                <Pill tone="muted">{f.table}</Pill>
                {stat && stat.total > 0 ? (
                  <Pill tone="accent">
                    {stat.total} received{stat.latest ? ` · last ${age(stat.latest)} ago` : ""}
                  </Pill>
                ) : (
                  <Pill tone="muted">none yet</Pill>
                )}
              </div>

              <p className="mt-2 text-sm text-[color:var(--muted)]">{f.where}</p>

              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="eyebrow">Chain</dt>
                  <dd className="mt-1 flex flex-wrap items-center gap-1.5">
                    <A href={f.page} className="underline underline-offset-4">{f.page}</A>
                    <span aria-hidden="true" className="text-[color:var(--muted)]">→</span>
                    <Code>{f.endpoint}</Code>
                    <span aria-hidden="true" className="text-[color:var(--muted)]">→</span>
                    <Code>{f.table}</Code>
                    {f.screen !== "—" && (
                      <>
                        <span aria-hidden="true" className="text-[color:var(--muted)]">→</span>
                        <A href={f.screen} className="underline underline-offset-4">{f.screen}</A>
                      </>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Fields</dt>
                  <dd className="mt-1">{f.fields.join(", ")}</dd>
                </div>
              </dl>

              <p className="mt-4 border-t border-[color:var(--console-line)] pt-4 text-sm text-[color:var(--muted)]">
                {f.guard}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
