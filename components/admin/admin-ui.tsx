import type { ReactNode } from "react";

/**
 * The primitives.
 *
 * Every console screen is assembled from these five, which is what keeps
 * fifteen screens looking like one product without a design review per screen.
 * A screen that needs something these cannot express is a signal to add a
 * primitive here, not to hand-roll a card in one route.
 */

export function AdminHeader({
  eyebrow, title, intro, actions,
}: { eyebrow?: string; title: string; intro?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[color:var(--console-line)] pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
        {intro && <p className="mt-2 max-w-prose text-sm text-[color:var(--muted)]">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title, hint, children, className = "", padded = true,
}: { title?: string; hint?: string; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section
      className={`rounded-lg border border-[color:var(--console-line)] bg-[color:var(--console-surface)] ${className}`}
    >
      {title && (
        <div className="border-b border-[color:var(--console-line)] px-5 py-4">
          <h2 className="font-display text-base font-bold">{title}</h2>
          {hint && <p className="mt-1 text-sm text-[color:var(--muted)]">{hint}</p>}
        </div>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--console-line)] bg-[color:var(--console-surface)] px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold leading-none tabular-nums">{value}</p>
      {hint && <p className="mt-2 text-sm text-[color:var(--muted)]">{hint}</p>}
    </div>
  );
}

export type Tone = "default" | "accent" | "success" | "warn" | "muted";

/**
 * Tones are semantic, and each one is a pair that passes AA at 12px.
 * `accent` is ink on teal (6.66) — teal on white is 2.45 and is never used for
 * text anywhere in this build.
 */
export function Pill({ tone = "default", children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    default: "bg-ink text-paper",
    accent: "bg-teal text-ink",
    success: "bg-ink/8 text-ink ring-1 ring-inset ring-ink/20",
    warn: "bg-[#7a2e12] text-paper",
    muted: "bg-ink/[0.06] text-[color:var(--muted)]",
  };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export const fieldCls =
  "mt-1.5 min-h-[40px] w-full rounded-md border border-ink/25 bg-[color:var(--console-surface)] px-3 py-2 " +
  "text-sm outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-teal";

export function Field({
  label, hint, htmlFor, className = "", children,
}: { label: string; hint?: string; htmlFor?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">{label}</label>
      {hint && <p className="mt-1 text-sm text-[color:var(--muted)]">{hint}</p>}
      {children}
    </div>
  );
}

/** The console's one button, in two weights. */
export function Button({
  children, weight = "quiet", type = "submit", name, value, formAction,
}: {
  children: ReactNode; weight?: "loud" | "quiet"; type?: "submit" | "button";
  name?: string; value?: string; formAction?: string;
}) {
  const styles =
    weight === "loud"
      ? "bg-ink text-paper hover:bg-slate"
      : "border border-ink/25 hover:bg-ink/5";
  return (
    <button
      type={type} name={name} value={value} formAction={formAction}
      className={`min-h-[40px] rounded-md px-4 text-sm font-medium transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}

/** Shown when Supabase is not wired up yet — the honest state, not an error. */
export function NotConfigured() {
  return (
    <div className="rounded-lg border-2 border-dashed border-ink/20 bg-[color:var(--console-surface)] p-8">
      <h2 className="font-display text-xl font-bold">No database connected yet</h2>
      <p className="mt-3 max-w-prose text-[color:var(--muted)]">
        The console is built and the forms on the site post to real endpoints, but
        there is nowhere to put what they collect until a Supabase project exists
        and <Code>SUPABASE_URL</Code>, <Code>SUPABASE_SECRET_KEY</Code>,{" "}
        <Code>SUPABASE_PUBLISHABLE_KEY</Code> and <Code>ADMIN_EMAILS</Code> are set
        on the deploy target.
      </p>
      <p className="mt-3 max-w-prose text-[color:var(--muted)]">
        The schema is in <Code>supabase/migrations/</Code>.
      </p>
    </div>
  );
}

/** Reads work with the secret key; the write contract needs the person's own
 *  token alongside the publishable key. Saying which half is missing saves
 *  someone discovering it at the first Save. */
export function NotWritable() {
  return (
    <div className="rounded-lg border border-ink/20 bg-[color:var(--console-surface)] p-5">
      <p className="text-sm">
        <strong>Read-only.</strong>{" "}
        <span className="text-[color:var(--muted)]">
          <Code>SUPABASE_PUBLISHABLE_KEY</Code> is not set. Every write goes through the
          database&rsquo;s own admin check, which needs your access token and that key
          together — the secret key would bypass the check it is meant to pass.
        </span>
      </p>
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return <code className="rounded bg-ink/[0.07] px-1 py-0.5 text-[0.9em]">{children}</code>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--console-line)] bg-[color:var(--console-surface)] p-10 text-center text-[color:var(--muted)]">
      {children}
    </div>
  );
}

/** The result of the last POST, read from the query string the route set. A
 *  banner rather than a toast: it survives the redirect, and it is still there
 *  when someone comes back to the tab. */
export function SaveBanner({ state, message }: { state?: string; message?: string }) {
  if (state !== "saved" && state !== "error") return null;
  const ok = state === "saved";
  return (
    <p
      role="status"
      className={`rounded-md border px-4 py-3 text-sm ${
        ok ? "border-ink/20 bg-teal/15" : "border-[#7a2e12] bg-[#7a2e12]/10"
      }`}
    >
      {ok ? "Saved." : `Not saved. ${message ?? "The database refused the change."}`}
    </p>
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

export function when(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}
