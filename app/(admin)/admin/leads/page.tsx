import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured } from "../../../../lib/env";
import { listAllLeads } from "../../../../lib/db";
import { AdminShell, NotConfigured, Empty, Pill, age } from "../../../../components/admin";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };

/**
 * A lead is a person who wanted a price.
 *
 * Sorted by age, not by name — the oldest unanswered request is the one that
 * costs money. Status changes are one click from the list; making someone open
 * a detail page to change a dropdown is friction in the place it is most
 * expensive.
 */
const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;

export default async function LeadsPage() {
  const user = await requireUser();
  if (!configured()) return <AdminShell title="Leads" user={user}><NotConfigured /></AdminShell>;

  const leads = await listAllLeads();
  const open = leads.filter((l) => ["new", "contacted", "quoted"].includes(l.status));
  const closed = leads.filter((l) => !["new", "contacted", "quoted"].includes(l.status));

  return (
    <AdminShell title="Leads" intro={`${open.length} open · ${leads.length} total`} user={user}>
      {leads.length === 0 ? (
        <Empty>No quote requests yet. They arrive here the moment someone uses the form.</Empty>
      ) : (
        <div className="space-y-10">
          <Table rows={[...open].sort((a, b) => a.created_at.localeCompare(b.created_at))} heading="Open — oldest first" />
          {closed.length > 0 && <Table rows={closed} heading="Closed" dim />}
        </div>
      )}
    </AdminShell>
  );
}

function Table({ rows, heading, dim = false }: {
  rows: Awaited<ReturnType<typeof listAllLeads>>; heading: string; dim?: boolean;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold">{heading}</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-paper">
        <table className="w-full min-w-[52rem] text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-[color:var(--muted)]">
              <th scope="col" className="px-5 py-3 font-medium">Waiting</th>
              <th scope="col" className="px-5 py-3 font-medium">Name</th>
              <th scope="col" className="px-5 py-3 font-medium">Contact</th>
              <th scope="col" className="px-5 py-3 font-medium">Job</th>
              <th scope="col" className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((l) => (
              <tr key={l.id} className={dim ? "opacity-60" : undefined}>
                <td className="whitespace-nowrap px-5 py-4">
                  <Pill tone={l.status === "new" ? "new" : "muted"}>{age(l.created_at)}</Pill>
                </td>
                <td className="px-5 py-4 font-medium">{l.name}</td>
                <td className="px-5 py-4">
                  <a href={`mailto:${l.email}`} className="underline underline-offset-4">{l.email}</a>
                  {l.phone && (
                    <>
                      <br />
                      <a href={`tel:${l.phone}`} className="whitespace-nowrap underline underline-offset-4">{l.phone}</a>
                    </>
                  )}
                </td>
                <td className="px-5 py-4">
                  {l.service ?? "—"}
                  {(l.town || l.address) && (
                    <span className="block text-[color:var(--muted)]">{l.town ?? l.address}</span>
                  )}
                  {l.message && <span className="mt-1 block max-w-md text-[color:var(--muted)]">{l.message}</span>}
                </td>
                <td className="px-5 py-4">
                  {/* One click from the list. A GET form would be simpler and
                      would also let a link prefetch change someone's pipeline. */}
                  <form action="/api/admin/lead-status" method="post" className="flex gap-2">
                    <input type="hidden" name="id" value={l.id} />
                    <label className="sr-only" htmlFor={`s-${l.id}`}>Status for {l.name}</label>
                    <select
                      id={`s-${l.id}`} name="status" defaultValue={l.status}
                      className="min-h-[38px] rounded-lg border border-ink/25 bg-paper px-2 py-1"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="min-h-[38px] rounded-lg border border-ink/25 px-3 hover:bg-ink/5">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
