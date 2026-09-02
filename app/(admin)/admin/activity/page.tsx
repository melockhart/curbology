import type { Metadata } from "next";
import { configured } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listActivity } from "../../../../lib/db";
import { AdminHeader, NotConfigured, Empty, Card, Pill, when } from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Activity Log" };

/**
 * Every privileged change, who made it and when.
 *
 * The rows are written by the database, inside the same functions that make the
 * changes — not by the route handlers. A screen added later cannot forget to
 * log, and a write made outside the console still appears here, which is the
 * only version of an audit log worth having.
 *
 * Nothing on this page can be edited or deleted. There is no policy that would
 * allow it, so the absence of a delete button is a fact about the database
 * rather than a decision about the UI.
 */
const LABELS: Record<string, string> = {
  set_status: "changed the status",
  set_quote: "set a quote",
  set_state: "changed the state",
  upsert: "saved",
  create: "added",
  update: "edited",
  delete: "removed",
  grant_role: "granted a role",
  revoke_role: "revoked a role",
  suspend: "suspended",
  unsuspend: "un-suspended",
};

export default async function ActivityPage() {
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Data" title="Activity Log" /><NotConfigured /></div>;
  }

  const rows = await listActivity();

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Data"
        title="Activity Log"
        intro="Written by the database inside each change, so it records what happened rather than what a screen meant to do. Read-only, by design and by policy."
      />

      {rows.length === 0 ? (
        <Empty>Nothing has been changed yet.</Empty>
      ) : (
        <Card padded={false}>
          <ul className="divide-y divide-[color:var(--console-line)]">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3.5 text-sm">
                <Pill tone="muted">{r.entity}</Pill>
                <span className="font-medium">{r.actor_email ?? "unknown"}</span>
                <span>{LABELS[r.verb] ?? r.verb}</span>
                {r.entity_id && (
                  <code className="truncate text-xs text-[color:var(--muted)]">{r.entity_id}</code>
                )}
                {Object.keys(r.detail ?? {}).length > 0 && (
                  <span className="text-[color:var(--muted)]">
                    {Object.entries(r.detail)
                      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                      .join(" · ")}
                  </span>
                )}
                <span className="ml-auto whitespace-nowrap text-[color:var(--muted)]">{when(r.created_at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
