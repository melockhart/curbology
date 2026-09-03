import type { ReactNode } from "react";
import { A } from "./link";

/**
 * Buttons carry the corrected contrast pairs. See globals.css for why the live
 * site's own button tokens (1.64:1) are not used.
 */
export function Button({
  href, children, variant = "primary",
}: { href: string; children: ReactNode; variant?: "primary" | "onTeal" }) {
  // .btn carries the depth and the press; the variant only picks the face.
  // Both faces keep a solid background-color under the gradient so contrast
  // stays measurable — see globals.css.
  const face = variant === "primary" ? "btn--ink" : "btn--paper";
  return (
    <A href={href} className={`btn ${face} text-base`}>
      {children}
    </A>
  );
}

export type Ground = "paper" | "shallow" | "teal" | "deep" | "ink";

/**
 * A section, and one step of the wash.
 *
 * Every section declares the ground it arrives on. The section boundary is not
 * a margin — it is where the page gets cleaner, so each section carries the
 * edge that washes the previous ground away and the grime that lifts as it
 * passes. Both are driven from one scroll-linked value set by the wash driver,
 * so they cannot drift apart.
 *
 * `washFrom` is the ground being washed off. It has to be named rather than
 * inferred: a section does not know what precedes it, and guessing wrong means
 * the edge paints a colour that is not on the page.
 */
export function Section({
  ground = "paper", children, id, grain = false, washFrom, dirty = false, className = "",
}: {
  ground?: Ground;
  children: ReactNode;
  id?: string;
  grain?: boolean;
  /** The ground above this one, washed away by the edge. Omit on the first. */
  washFrom?: Ground;
  /** Carry grime that lifts as the wash passes. */
  dirty?: boolean;
  className?: string;
}) {
  const grounds: Record<Ground, string> = {
    paper: "ground-paper bg-paper text-ink",
    shallow: "ground-shallow bg-stone-050 text-ink",
    teal: "ground-teal bg-teal text-ink",
    deep: "ground-deep bg-teal-900 text-stone-050",
    ink: "ground-ink bg-ink text-stone-050",
  };
  const edgeColour: Record<Ground, string> = {
    paper: "#ffffff",
    shallow: "var(--color-stone-050)",
    teal: "var(--color-teal-500)",
    deep: "var(--color-teal-900)",
    ink: "var(--color-stone-950)",
  };

  return (
    <section
      id={id}
      data-wash-section=""
      className={`relative isolate ${grounds[ground]} ${grain ? "grain" : ""} ${className}`}
    >
      {washFrom && (
        <div
          aria-hidden="true"
          className="wash-edge -top-px"
          style={{ ["--wash-from" as string]: edgeColour[washFrom] }}
        />
      )}
      {dirty && <div aria-hidden="true" className="grime-layer" />}
      <div className="relative z-[3] mx-auto w-full max-w-6xl px-6 py-20 md:py-28">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 font-body text-sm font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
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
      className={`flex aspect-[4/3] items-center justify-center rounded-2xl border-2 border-dashed border-current/30 p-6 text-center text-[color:var(--muted)] ${className}`}
    >
      <p className="max-w-xs text-sm">
        <span className="block font-medium">Photography to come</span>
        {label}
      </p>
    </div>
  );
}


/**
 * The proof band — the fourth locked hard-block, standing in for itself.
 *
 * The standard wants proof high on the page. Curbology has none: the live
 * site's "300+ Projects · 3+ Years · 100% Satisfaction" band was removed
 * because Tristen does not know where those numbers came from, there are no
 * reviews yet, and there are no photographs.
 *
 * So this carries only what is checkable — the services actually sold, the
 * county and the towns named on the live site, and the number that carries a
 * real tel: link there. Set as a spec plate rather than as counted stats,
 * because counted stats with nothing to count is precisely the thing that was
 * deleted.
 *
 * ⚠️ WHAT REPLACES IT. The moment reviews are published and photography lands,
 * this becomes the real proof band — rating, review count, before-and-afters —
 * and these three plates move down the page. It is a placeholder for a shape,
 * never for a fact.
 */
export function ProofBand({
  items,
}: { items: Array<{ label: string; value: string; note?: string }> }) {
  return (
    <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.label} className="border-t pt-5" style={{ borderColor: "var(--rule)" }}>
          <p className="font-spec text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {item.label}
          </p>
          <p
            data-wash-type
            className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl"
          >
            {item.value}
          </p>
          {item.note && (
            <p className="mt-2 text-sm text-[color:var(--muted)]">{item.note}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
