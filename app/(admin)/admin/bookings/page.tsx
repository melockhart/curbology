import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listBookings } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button, Field,
  SaveBanner, age, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Bookings" };

/** Requested → confirmed → recorded → received. The "recorded" state is what
 *  lets the queue empty; without it every past booking sits here forever. */
const STATES = ["requested", "confirmed", "recorded", "received", "published", "declined", "no-show"] as const;
const OPEN = ["requested", "confirmed", "recorded"];

export default async function BookingsPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Bookings" /><NotConfigured /></div>;
  }

  const bookings = await listBookings();
  const open = bookings.filter((b) => OPEN.includes(b.state));

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Work"
        title="Testimonial bookings"
        intro="Requests to film a testimonial. Scheduling is by hand until you name a calendar to connect."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Waiting to schedule" value={bookings.filter((b) => b.state === "requested").length} />
        <Stat label="Booked in" value={bookings.filter((b) => b.state === "confirmed").length} />
        <Stat label="Footage in hand" value={bookings.filter((b) => b.video_url).length}
          hint={`${open.length} open · ${bookings.length} total`} />
      </div>

      {bookings.length === 0 ? (
        <Empty>No testimonial requests yet.</Empty>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => (
            <li key={b.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg font-bold">{b.name}</span>
                  <Pill tone={b.state === "requested" ? "accent" : b.state === "received" ? "default" : "muted"}>
                    {b.state}
                  </Pill>
                  {b.format && <Pill tone="muted">{b.format.replace("-", " ")}</Pill>}
                  <span className="ml-auto text-sm text-[color:var(--muted)]">{age(b.created_at)} ago</span>
                </div>

                <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="eyebrow">Contact</dt>
                    <dd className="mt-1">
                      <a href={`mailto:${b.email}`} className="underline underline-offset-4">{b.email}</a>
                      {b.phone && <> · <a href={`tel:${b.phone}`} className="underline underline-offset-4">{b.phone}</a></>}
                    </dd>
                  </div>
                  <div>
                    <dt className="eyebrow">When suits them</dt>
                    <dd className="mt-1 whitespace-pre-wrap">{b.requested_slots ?? "—"}</dd>
                  </div>
                </dl>
                {b.notes && <p className="mt-3 text-sm text-[color:var(--muted)]">{b.notes}</p>}

                <form action="/api/admin/booking" method="post"
                  className="mt-5 flex flex-wrap items-end gap-3 border-t border-[color:var(--console-line)] pt-5">
                  <input type="hidden" name="id" value={b.id} />
                  <Field label="State" htmlFor={`st-${b.id}`}>
                    <select id={`st-${b.id}`} name="state" defaultValue={b.state} className={`${fieldCls} w-auto`}>
                      {STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </Field>
                  <Field label="Video link" htmlFor={`v-${b.id}`} className="min-w-[16rem] flex-1">
                    <input id={`v-${b.id}`} name="video_url" type="url"
                      defaultValue={b.video_url ?? ""} className={fieldCls} />
                  </Field>
                  <Button>Save</Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
