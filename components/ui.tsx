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
 * A section, cut on the lane's angle.
 *
 * The boundary between two sections used to be a horizontal wash edge. It is
 * now a diagonal on the same angle as everything else, and the section climbs
 * into the one above it so the two interlock with no seam — a clip alone leaves
 * a wedge of page showing through.
 *
 * `cut` alternates the slope. Every boundary falling the same way is a pattern;
 * alternating is a rhythm.
 */
export function Section({
  ground = "paper", children, id, dirty = false, cut = "l", tall = false,
  margin, className = "",
}: {
  ground?: Ground;
  children: ReactNode;
  id?: string;
  /** Carry grime that lifts as the wash passes. */
  dirty?: boolean;
  /** Which way the diagonal boundary falls. `false` for the first section. */
  cut?: "l" | "r" | false;
  tall?: boolean;
  /** Marginalia, set on the angle down the side. Decorative — never content. */
  margin?: string;
  className?: string;
}) {
  const grounds: Record<Ground, string> = {
    paper: "ground-paper bg-paper text-ink",
    shallow: "ground-shallow bg-stone-050 text-ink",
    teal: "ground-teal bg-teal text-ink",
    deep: "ground-deep bg-teal-900 text-stone-050",
    ink: "ground-ink bg-ink text-stone-050",
  };

  return (
    <section
      id={id}
      data-wash-section=""
      className={`relative isolate ${grounds[ground]} ${
        cut === "l" ? "cut-top" : cut === "r" ? "cut-top-rev" : ""
      } ${className}`}
    >
      {dirty && <div aria-hidden="true" className="grime-layer" />}

      {margin && (
        <p
          aria-hidden="true"
          className="font-spec pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rotate-[-13deg] whitespace-nowrap text-[11px] uppercase tracking-[0.36em] text-[color:var(--muted)] xl:block"
        >
          {margin}
        </p>
      )}

      <div className="relative z-[3] mx-auto w-full max-w-6xl px-6 pb-12 md:pb-16"
           /* The cut is deepest on one side only, so content needs to clear
              --cut and very little more. 3.5rem on top of it was two hundred
              pixels of nothing at every boundary. */
           style={{
             paddingTop:
               cut === false
                 ? "calc(var(--bar-space) + 2rem)"
                 : tall
                   ? "calc(var(--cut) + 3rem)"
                   : "calc(var(--cut) + 1.75rem)",
           }}>
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
export function AwaitingPhoto({
  label, className = "", image,
}: { label: string; className?: string; image?: { url: string; alt: string } }) {
  // Once a picture is set for this slot it takes the panel's place.
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element -- sized by the uploaded file, stored off-site
    return <img src={image.url} alt={image.alt} loading="lazy" className={`w-full rounded-xl object-cover ${className}`} />;
  }
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
