import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured, writable, allowedEmails } from "../../../../lib/env";
import { rpcRows, type AdminUser } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Pill, Button, Code, SaveBanner,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Team Access" };

/**
 * Who can sign in, and who is an administrator.
 *
 * Two gates, not one, and they are independent on purpose:
 *
 *   ADMIN_EMAILS — an environment variable on the deploy target. An address not
 *   on it cannot exchange a password for a session at all, so a Supabase
 *   account alone is not a way in.
 *
 *   the admin role — a row in the database. It is what every RPC re-checks, so
 *   losing it stops writes even for someone whose session is valid.
 *
 * The list below reads the second. The first is shown beside it because the
 * commonest confusion in a console like this is someone being granted a role
 * and still not getting in.
 */
export default async function TeamAccessPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  const session = await requireUser();
  if (!configured()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Configure" title="Team Access" /><NotConfigured /></div>;
  }

  const users = await rpcRows<AdminUser>("list_users", {}, session);
  const allowed = [...allowedEmails()].sort();

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Team Access"
        intro="Both gates have to open. The allowlist decides who can sign in; the role decides what they can change."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <Card title="Sign-in allowlist"
        hint="Set as ADMIN_EMAILS on the deploy target, not from here — an address that could add itself is not an allowlist.">
        {allowed.length === 0 ? (
          <p className="text-sm text-[color:var(--muted)]">
            Nothing is set. With <Code>ADMIN_EMAILS</Code> empty, nobody can sign in at all.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {allowed.map((e) => (
              <li key={e}><Pill tone={e === session.email ? "accent" : "muted"}>{e}</Pill></li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Roles" padded={false}>
        {users.length === 0 ? (
          <div className="p-5">
            <Empty>
              No accounts yet — or none this session can read. The first person to sign in
              claims the administrator role from the Account screen.
            </Empty>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--console-line)]">
            {users.map((u) => {
              const isAdmin = u.roles.includes("admin");
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{u.display_name ?? u.email ?? u.id}</span>
                    <span className="block truncate text-[color:var(--muted)]">{u.email}</span>
                  </span>
                  {u.is_suspended && <Pill tone="warn">suspended</Pill>}
                  <Pill tone={isAdmin ? "accent" : "muted"}>{isAdmin ? "administrator" : "no role"}</Pill>
                  <form action="/api/admin/role" method="post">
                    <input type="hidden" name="user_id" value={u.id} />
                    <input type="hidden" name="role" value="admin" />
                    <input type="hidden" name="granted" value={isAdmin ? "no" : "yes"} />
                    <Button>{isAdmin ? "Revoke admin" : "Make admin"}</Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
