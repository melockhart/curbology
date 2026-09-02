import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { rpcRows, type AdminUser } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button,
  SaveBanner, when,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Users" };

/**
 * The accounts themselves — who exists, when they last signed in, and whether
 * they are suspended.
 *
 * Suspension rather than deletion. Deleting an account orphans everything it
 * touched in the activity log, and the log is the one record you cannot
 * reconstruct. Suspending is checked inside `has_role`, so it revokes every
 * policy and every RPC in a single write, immediately.
 */
export default async function UsersPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  const session = await requireUser();
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Configure" title="Users" /><NotConfigured /></div>;
  }

  const users = await rpcRows<AdminUser>("list_users", {}, session);
  const never = users.filter((u) => !u.last_sign_in_at).length;

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Users"
        intro="Accounts are created in Supabase. Suspending one here revokes everything it can do, without losing what it did."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Accounts" value={users.length} />
        <Stat label="Administrators" value={users.filter((u) => u.roles.includes("admin")).length} />
        <Stat label="Never signed in" value={never} />
      </div>

      {users.length === 0 ? (
        <Empty>No accounts to show. Create one in Supabase, then add its address to ADMIN_EMAILS.</Empty>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-[color:var(--console-line)] text-left">
                  {["Person", "Roles", "Created", "Last signed in", ""].map((h) => (
                    <th key={h} scope="col" className="px-5 py-3"><span className="eyebrow">{h}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--console-line)]">
                {users.map((u) => (
                  <tr key={u.id} className={u.is_suspended ? "opacity-60" : undefined}>
                    <td className="px-5 py-4">
                      <span className="block font-medium">{u.display_name ?? "—"}</span>
                      <span className="block text-[color:var(--muted)]">{u.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 && <Pill tone="muted">none</Pill>}
                        {u.roles.map((r) => <Pill key={r} tone="accent">{r}</Pill>)}
                        {u.is_suspended && <Pill tone="warn">suspended</Pill>}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[color:var(--muted)]">{when(u.created_at)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-[color:var(--muted)]">
                      {u.last_sign_in_at ? when(u.last_sign_in_at) : "never"}
                    </td>
                    <td className="px-5 py-4">
                      {u.id === session.id ? (
                        <span className="text-[color:var(--muted)]">you</span>
                      ) : (
                        <form action="/api/admin/suspend" method="post">
                          <input type="hidden" name="user_id" value={u.id} />
                          <input type="hidden" name="suspended" value={u.is_suspended ? "no" : "yes"} />
                          <Button>{u.is_suspended ? "Restore" : "Suspend"}</Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
