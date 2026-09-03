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
  ground = "paper", children, id, grain = false, washFrom, dirty = false, tall = false, className = "",
}: {
  ground?: Ground;
  children: ReactNode;
  id?: string;
  grain?: boolean;
  /** The ground above this one, washed away by the edge. Omit on the first. */
  washFrom?: Ground;
  /** Carry grime that lifts as the wash passes. */
  dirty?: boolean;
  /**
   * Extra room, for a section that earns it. The default is deliberately
   * tighter than it was: the wash boundary now does the separating that 112px
   * of padding used to do, and doing both left a quarter of the page empty.
   */
  tall?: boolean;
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
      {/* An edge washing a ground onto itself is invisible and costs 132px.
          Two sections that share a ground simply meet. */}
      {washFrom && washFrom !== ground && (
        <div
          aria-hidden="true"
          className="wash-edge -top-px"
          style={{ ["--wash-from" as string]: edgeColour[washFrom] }}
        />
      )}
      {dirty && <div aria-hidden="true" className="grime-layer" />}
      <div
        className={`relative z-[3] mx-auto w-full max-w-6xl px-6 ${
          tall ? "py-20 md:py-28" : "py-14 md:py-20"
        }`}
      >
        {children}
      </div>
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
  /*
   * An image slot with no image — sized to what it SAYS, not to the photograph
   * that is not there.
   *
   * It used to be aspect-[4/3], which on this layout is a 745px hole holding
   * ninety characters. Reserving a photograph's footprint made sense when the
   * design was photography-led; the direction now is that type and motion carry
   * the page and photographs improve it later. A slot that reserves space it
   * cannot fill is just a hole with a caption in it.
   *
   * Still honest, still visibly a slot, still never stock — one third the
   * height and it reads as a note in the layout rather than as a gap in it.
   */
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border border-dashed p-5 ${className}`}
      style={{ borderColor: "var(--rule)" }}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg"
        style={{ background: "color-mix(in srgb, currentColor 10%, transparent)" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
             className="h-[18px] w-[18px]" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m4 17 4.5-4.5 3 3L15 12l5 5" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="font-spec block text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
          Photography to come
        </span>
        <span className="mt-1.5 block text-sm text-[color:var(--muted)]">{label}</span>
      </span>
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
 * because counted stats with nothing to count is precisely what was deleted.
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
    <ul className="grid gap-x-12 gap-y-8 sm:grid-cols-3">
      {items.map((item) => (
        <li key={item.label} className="border-t pt-4" style={{ borderColor: "var(--rule)" }}>
          <p className="font-spec text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
            {item.label}
          </p>
          <p
            data-wash-type
            className="mt-2.5 font-display text-3xl font-bold leading-tight md:text-4xl"
          >
            {item.value}
          </p>
          {item.note && <p className="mt-2 text-sm text-[color:var(--muted)]">{item.note}</p>}
        </li>
      ))}
    </ul>
  );
}
