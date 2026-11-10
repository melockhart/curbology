import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listAllLeads, type Lead } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button,
  SaveBanner, age, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Leads" };

/**
 * A lead is a person who wanted a price.
 *
 * Sorted by age, not by name — the oldest unanswered request is the one that
 * costs money. Status changes are one click from the list; making someone open
 * a detail page to change a dropdown is friction in the place it is most
 * expensive.
 */
const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;
const OPEN = ["new", "contacted", "quoted"];

export default async function LeadsPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Leads" /><NotConfigured /></div>;
  }

  const leads = await listAllLeads();
  const open = leads.filter((l) => OPEN.includes(l.status));
  const closed = leads.filter((l) => !OPEN.includes(l.status));
  const won = leads.filter((l) => l.status === "won");

  return (
    <div className="space-y-8">
      <AdminHeader eyebrow="Work" title="Leads" intro={`${open.length} open · ${leads.length} total`} />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Waiting on you" value={leads.filter((l) => l.status === "new").length} />
        <Stat label="Quoted, not closed" value={leads.filter((l) => l.status === "quoted").length} />
        <Stat label="Won" value={won.length}
          hint={won.length ? `${money(won.reduce((t, l) => t + Number(l.quoted_amount ?? 0), 0))} quoted` : undefined} />
      </div>

      {leads.length === 0 ? (
        <Empty>No quote requests yet. They arrive here the moment someone uses the form.</Empty>
      ) : (
        <div className="space-y-6">
          <Table rows={[...open].sort((a, b) => a.created_at.localeCompare(b.created_at))}
            heading="Open — oldest first" />
          {closed.length > 0 && <Table rows={closed} heading="Closed" dim />}
        </div>
      )}
    </div>
  );
}

function money(n: number): string {
  return n ? `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "$0";
}

function Table({ rows, heading, dim = false }: { rows: Lead[]; heading: string; dim?: boolean }) {
  return (
    <Card title={heading} padded={false}>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[62rem] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--console-line)] text-left">
              {["Waiting", "Name", "Contact", "Job", "Status"].map((h) => (
                <th key={h} scope="col" className="px-5 py-3"><span className="eyebrow">{h}</span></th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--console-line)]">
            {rows.map((l) => (
              <tr key={l.id} className={dim ? "opacity-60" : undefined}>
                <td className="whitespace-nowrap px-5 py-4">
                  <Pill tone={l.status === "new" ? "accent" : "muted"}>{age(l.created_at)}</Pill>
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
                  <form action="/api/admin/lead-status" method="post" className="flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={l.id} />
                    <label className="sr-only" htmlFor={`s-${l.id}`}>Status for {l.name}</label>
                    <select id={`s-${l.id}`} name="status" defaultValue={l.status}
                      className={`${fieldCls} mt-0 w-[8.5rem]`}>
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <label className="sr-only" htmlFor={`q-${l.id}`}>Quote for {l.name}</label>
                    <input id={`q-${l.id}`} name="quoted_amount" type="number" min="0" step="1"
                      placeholder="Quote" defaultValue={l.quoted_amount ?? ""}
                      className={`${fieldCls} mt-0 w-24`} />
                    <Button>Save</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
