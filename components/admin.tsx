import type { ReactNode } from "react";
import { A } from "./link";

/**
 * The console is a working tool for one or two people who run a service
 * business, not an ops team. It carries no motion — motion in something you
 * open every morning is friction, not delight — and no marketing chrome.
 *
 * Dense, quiet, and organised around "what needs me today" rather than around
 * the shape of the database.
 */
export const ADMIN_NAV = [
  { href: "/admin", label: "Today" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/content", label: "Content" },
] as const;

export function AdminShell({
  title, intro, children, user,
}: { title: string; intro?: string; children: ReactNode; user: string }) {
  return (
    <div className="ground-paper min-h-screen bg-[#f6f7f9]">
      <header className="border-b border-ink/10 bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3">
          <A href="/admin" className="flex items-center gap-2" aria-label="Curbology console">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/curbology-logo.png" alt="" className="h-8 w-auto" />
            <span className="text-sm font-medium">Console</span>
          </A>
          <nav aria-label="Console" className="mr-auto">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {ADMIN_NAV.map((item) => (
                <li key={item.href}>
                  <A href={item.href} className="hover:underline hover:underline-offset-4">{item.label}</A>
                </li>
              ))}
            </ul>
          </nav>
          <span className="text-sm text-[color:var(--muted)]">{user}</span>
          <form action="/api/sign-out" method="post">
            <button className="text-sm underline underline-offset-4">Sign out</button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {intro && <p className="mt-2 text-[color:var(--muted)]">{intro}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

/** Shown when Supabase is not wired up yet — the honest state, not an error. */
export function NotConfigured() {
  return (
    <div className="rounded-xl border-2 border-dashed border-ink/20 bg-paper p-8">
      <h2 className="font-display text-xl font-bold">No database connected yet</h2>
      <p className="mt-3 max-w-prose text-[color:var(--muted)]">
        The console is built and the forms on the site post to real endpoints, but
        there is nowhere to put what they collect until a Supabase project exists
        and <code className="rounded bg-ink/5 px-1">SUPABASE_URL</code>,{" "}
        <code className="rounded bg-ink/5 px-1">SUPABASE_SECRET_KEY</code> and{" "}
        <code className="rounded bg-ink/5 px-1">ADMIN_EMAILS</code> are set on the
        deploy target.
      </p>
      <p className="mt-3 max-w-prose text-[color:var(--muted)]">
        The schema is in <code className="rounded bg-ink/5 px-1">supabase/migrations/</code>.
      </p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-10 text-center text-[color:var(--muted)]">
      {children}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "new" | "live" | "done" | "muted"; children: ReactNode }) {
  const tones = {
    new: "bg-teal text-ink",
    live: "bg-ink text-paper",
    done: "bg-ink/10 text-ink",
    muted: "bg-ink/5 text-[color:var(--muted)]",
  } as const;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** How long something has been sitting. The oldest unanswered lead is the one
 *  that costs money, so age is the number that belongs in the list. */
export function age(iso: string): string {
  const hours = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (hours < 1) return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
}
