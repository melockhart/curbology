import type { ReactNode } from "react";
import { A } from "./link";

/**
 * Buttons carry the corrected contrast pairs. See globals.css for why the live
 * site's own button tokens (1.64:1) are not used.
 */
export function Button({
  href, children, variant = "primary",
}: { href: string; children: ReactNode; variant?: "primary" | "onTeal" }) {
  const styles =
    variant === "primary"
      ? "bg-ink text-paper hover:bg-slate"        // 16.32:1
      : "bg-paper text-ink hover:bg-white/90";    // on a teal ground, 16.32:1
  return (
    <A
      href={href}
      className={`inline-flex min-h-[44px] items-center rounded-full px-7 py-3 text-base font-medium transition-colors ${styles}`}
    >
      {children}
    </A>
  );
}

export function Section({
  ground = "paper", children, id,
}: { ground?: "paper" | "teal" | "ink"; children: ReactNode; id?: string }) {
  // Teal ground with ink type is the brand's signature pairing and the one
  // combination here that is both on-brand and accessible at 6.66:1.
  const grounds = {
    paper: "bg-paper text-ink",
    teal: "bg-teal text-ink",
    ink: "bg-ink text-paper",
  } as const;
  return (
    <section id={id} className={grounds[ground]}>
      <div className="mx-auto w-full max-w-6xl px-6 py-20 md:py-28">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.14em] text-slate">
      {children}
    </p>
  );
}

/**
 * An image slot that has no image yet. Honest about it — never stock, never a
 * broken image. On an exterior-cleaning site the photograph is the argument, so
 * a missing one is worth naming rather than papering over.
 */
export function AwaitingPhoto({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-slate/30 bg-slate/5 p-6 text-center ${className}`}
    >
      <p className="max-w-xs text-sm text-slate">
        <span className="block font-medium">Photography to come</span>
        {label}
      </p>
    </div>
  );
}
