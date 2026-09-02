import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { rpcRows, type AdminUser } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, Card, Pill, Button, SaveBanner, Code, when,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Account" };

/**
 * You.
 *
 * The one screen that has to work before anything else does, which is why the
 * claim-admin button lives here: a fresh Supabase project has accounts and no
 * roles, and without this the first person in would be locked out of the
 * console they just signed into.
 *
 * The button only appears while the database will actually accept the claim —
 * `claim_admin()` refuses once any administrator exists, so this is not a
 * second gate, it is an accurate label on the first one.
 */
export default async function AccountPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  const session = await requireUser();
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Configure" title="Account" /><NotConfigured /></div>;
  }

  const users = await rpcRows<AdminUser>("list_users", {}, session);
  const me = users.find((u) => u.id === session.id);
  const anyAdmin = users.some((u) => u.roles.includes("admin"));
  // No admin readable and no admin visible means either the role is unclaimed
  // or this session cannot see the table — the claim itself is the safe way to
  // find out, because it refuses if it is wrong.
  const canClaim = session.isGodMode && !anyAdmin && writable();

  return (
    <div className="space-y-8">
      <AdminHeader eyebrow="Configure" title="Account" intro={session.email} />
      <SaveBanner state={s} message={m} />

      <Card title="Signed in as">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Email</dt>
            <dd className="mt-1">{session.email}</dd>
          </div>
          <div>
            <dt className="eyebrow">Role</dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {me?.roles.length
                ? me.roles.map((r) => <Pill key={r} tone="accent">{r}</Pill>)
                : <Pill tone="muted">no role in the database</Pill>}
              {session.isGodMode && <Pill tone="default">owner</Pill>}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Account created</dt>
            <dd className="mt-1 text-[color:var(--muted)]">{me ? when(me.created_at) : "—"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Last signed in</dt>
            <dd className="mt-1 text-[color:var(--muted)]">
              {me?.last_sign_in_at ? when(me.last_sign_in_at) : "this session"}
            </dd>
          </div>
        </dl>
      </Card>

      {canClaim && (
        <Card title="Claim the administrator role"
          hint="Only possible while nobody holds it. After that, roles are granted from Team Access.">
          <form action="/api/admin/claim" method="post">
            <Button weight="loud">Claim administrator</Button>
          </form>
        </Card>
      )}

      {!me?.roles.includes("admin") && !canClaim && (
        <Card title="You can sign in, but you cannot change anything">
          <p className="max-w-prose text-sm text-[color:var(--muted)]">
            Your address is on <Code>ADMIN_EMAILS</Code>, which is what let you in. Every
            write is checked again by the database against the <Code>admin</Code> role, and
            you do not hold it. Someone who does can grant it from Team Access.
          </p>
        </Card>
      )}

      <Card title="Session">
        <p className="max-w-prose text-sm text-[color:var(--muted)]">
          Your session is an HttpOnly cookie holding a Supabase access token. It is
          re-verified against Supabase on every request rather than trusted as it
          arrives, so signing out here ends it everywhere this browser is used.
        </p>
        <form action="/api/sign-out" method="post" className="mt-4">
          <Button>Sign out</Button>
        </form>
      </Card>
    </div>
  );
}
