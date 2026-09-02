import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured } from "../../../../lib/env";
import { listBookings } from "../../../../lib/db";
import { AdminShell, NotConfigured, Empty, Pill, age } from "../../../../components/admin";

export const metadata: Metadata = { title: "Bookings", robots: { index: false, follow: false } };

/** Requested → confirmed → recorded → received. The "recorded" state is what
 *  lets the queue empty; without it every past booking sits here forever. */
const STATES = ["requested", "confirmed", "recorded", "received", "published", "declined", "no-show"] as const;

export default async function BookingsPage() {
  const user = await requireUser();
  if (!configured()) return <AdminShell title="Bookings" user={user}><NotConfigured /></AdminShell>;

  const bookings = await listBookings();
  const open = bookings.filter((b) => ["requested", "confirmed", "recorded"].includes(b.state));

  return (
    <AdminShell
      title="Testimonial bookings"
      intro={bookings.length ? `${open.length} open · ${bookings.length} total` : undefined}
      user={user}
    >
      {bookings.length === 0 ? (
        <Empty>No testimonial requests yet.</Empty>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-xl border border-ink/10 bg-paper p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold">{b.name}</span>
                <Pill tone={b.state === "requested" ? "new" : b.state === "received" ? "live" : "muted"}>{b.state}</Pill>
                {b.format && <Pill tone="muted">{b.format.replace("-", " ")}</Pill>}
                <span className="ml-auto text-sm text-[color:var(--muted)]">{age(b.created_at)} ago</span>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[color:var(--muted)]">Contact</dt>
                  <dd>
                    <a href={`mailto:${b.email}`} className="underline underline-offset-4">{b.email}</a>
                    {b.phone && <> · <a href={`tel:${b.phone}`} className="underline underline-offset-4">{b.phone}</a></>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[color:var(--muted)]">When suits them</dt>
                  <dd className="whitespace-pre-wrap">{b.requested_slots ?? "—"}</dd>
                </div>
              </dl>
              {b.notes && <p className="mt-3 text-sm text-[color:var(--muted)]">{b.notes}</p>}

              <form action="/api/admin/booking" method="post" className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-5">
                <input type="hidden" name="id" value={b.id} />
                <div>
                  <label htmlFor={`st-${b.id}`} className="block text-sm font-medium">State</label>
                  <select id={`st-${b.id}`} name="state" defaultValue={b.state}
                    className="mt-1 min-h-[38px] rounded-lg border border-ink/25 bg-paper px-2 py-1 text-sm">
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="min-w-[16rem] flex-1">
                  <label htmlFor={`v-${b.id}`} className="block text-sm font-medium">Video link</label>
                  <input id={`v-${b.id}`} name="video_url" type="url" defaultValue={b.video_url ?? ""}
                    className="mt-1 min-h-[38px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-1 text-sm" />
                </div>
                <button className="min-h-[38px] rounded-lg border border-ink/25 px-4 text-sm hover:bg-ink/5">Save</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
