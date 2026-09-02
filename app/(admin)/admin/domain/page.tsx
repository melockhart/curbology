import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser } from "../../../../lib/guard";
import { runtimeEnv, configured, writable } from "../../../../lib/env";
import { AdminHeader, Card, Pill, Code } from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Domain" };

/**
 * Deployment diagnostics. Owner-only, and the lock in the sidebar is not the
 * gate — this is.
 *
 * A nav item that renders a lock is a courtesy to the person looking at it; the
 * route refusing is what actually protects it. Anyone can type a URL.
 *
 * Nothing here shows a value: it shows whether each one is *set*. A console
 * that prints its own secret keys back at you has moved them from the deploy
 * target into a browser tab, a screenshot and a support thread.
 */
export default async function DomainPage() {
  const session = await requireUser();
  // 404 rather than 403: whether this screen exists is not information an
  // administrator without god mode needs to have confirmed.
  if (!session.isGodMode) notFound();

  const head = await headers();
  const host = head.get("host");
  const proto = head.get("x-forwarded-proto") ?? "https";
  const env = runtimeEnv();
  const expected = env.SITE_HOST;

  const checks: Array<{ label: string; ok: boolean; detail: string }> = [
    { label: "SUPABASE_URL", ok: Boolean(env.SUPABASE_URL), detail: "Where the database is" },
    { label: "SUPABASE_SECRET_KEY", ok: Boolean(env.SUPABASE_SECRET_KEY), detail: "Server-side reads" },
    { label: "SUPABASE_PUBLISHABLE_KEY", ok: Boolean(env.SUPABASE_PUBLISHABLE_KEY), detail: "Accompanies your token on every write" },
    { label: "ADMIN_EMAILS", ok: Boolean(env.ADMIN_EMAILS), detail: "Who may sign in at all" },
    { label: "OWNER_EMAILS", ok: Boolean(env.OWNER_EMAILS), detail: "Who sees this page" },
    { label: "SITE_HOST", ok: Boolean(env.SITE_HOST), detail: "The hostname this deployment expects" },
  ];

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Domain"
        intro="What this deployment thinks it is, and which of its settings are present. Values are never shown — only whether they are set."
      />

      <Card title="This request">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Served on</dt>
            <dd className="mt-1"><Code>{proto}://{host ?? "unknown"}</Code></dd>
          </div>
          <div>
            <dt className="eyebrow">Expected</dt>
            <dd className="mt-1">
              {expected ? <Code>{expected}</Code> : <span className="text-[color:var(--muted)]">not set</span>}
            </dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-[color:var(--console-line)] pt-4 text-sm">
          {!expected ? (
            <span className="text-[color:var(--muted)]">
              Set <Code>SITE_HOST</Code> and this page can tell you whether a request arrived
              on the hostname you meant. Until then it can only report what it was given.
            </span>
          ) : host === expected ? (
            <Pill tone="success">Serving on the expected hostname</Pill>
          ) : (
            <span className="flex flex-wrap items-center gap-2">
              <Pill tone="warn">Hostname mismatch</Pill>
              <span className="text-[color:var(--muted)]">
                Canonical URLs and email links are built from <Code>SITE_HOST</Code>, so this
                is worth resolving before sending anything.
              </span>
            </span>
          )}
        </p>
      </Card>

      <Card title="Configuration" padded={false}>
        <ul className="divide-y divide-[color:var(--console-line)]">
          {checks.map((c) => (
            <li key={c.label} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
              <Code>{c.label}</Code>
              <span className="min-w-0 flex-1 text-[color:var(--muted)]">{c.detail}</span>
              <Pill tone={c.ok ? "success" : "warn"}>{c.ok ? "set" : "not set"}</Pill>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="What works right now">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-3">
            <Pill tone={configured() ? "success" : "warn"}>{configured() ? "yes" : "no"}</Pill>
            <span>Reading — every screen shows real rows</span>
          </li>
          <li className="flex items-center gap-3">
            <Pill tone={writable() ? "success" : "warn"}>{writable() ? "yes" : "no"}</Pill>
            <span>Writing — Save buttons reach the database</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
