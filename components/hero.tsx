import { siteContent } from "../lib/cms";
import { A } from "./link";
import { Caustics } from "./motion/caustics";

/**
 * The hero, rebuilt around the lane.
 *
 * The previous version was three horizontal bands with an empty media well in
 * the middle — a layout designed for a photograph that does not exist, holding
 * a caption where the photograph should be. This has no media well and needs
 * none: the ground is live caustics, and the composition is the headline cut by
 * the lane.
 *
 * THE ONE FRAME. The headline is set twice. One copy is soft and wonky — the
 * surface nobody has washed — and one is cut crisp and masked to the track, so
 * the letterforms change state exactly on the line. That is the whole idea of
 * this site, standing still, in the first thing anyone sees. It survives a
 * screenshot, a share card and reduced motion, none of which the scroll wash did.
 *
 * Everything that converts is still in the server HTML and still out of the
 * lane's way: the phone number and the quote button never wait on the canvas.
 */
export async function Hero() {
  const { business, home, connective, pages } = await siteContent();
  return (
    <section
      data-wash-section
      className="ground-deep relative isolate overflow-hidden bg-teal-900 text-stone-050"
    >
      <Caustics
        ground="#053c40"
        light="#5ad4d5"
        intensity={0.6}
        scale={3.4}
        staticSrc="/brand/caustics-deep.jpg"
      />

      {/* Grain over the caustics, so the ground reads as a wet surface rather
          than as a gradient. */}
      <div aria-hidden="true" className="grain-layer absolute inset-0 z-[1]" />

      <div
        className="relative z-[3] mx-auto flex min-h-[calc(92svh-5.5rem)] w-full max-w-[1600px] flex-col justify-between px-6"
        /* The next section climbs into this one by --cut. Without clearance the
           overlap covers the phone number and the quote button — the two things
           on the page that must never be covered. */
        style={{
          paddingTop: "calc(var(--bar-space) + 2.5rem)",
          paddingBottom: "calc(var(--cut) + 3rem)",
        }}
      >
        {/* Marginalia on the angle — the label for the line itself. */}
        <p
          aria-hidden="true"
          className="font-spec pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 rotate-[-13deg] text-[11px] uppercase tracking-[0.3em] text-stone-400 lg:block"
        >
          {connective.hero.lane}
        </p>

        <div className="relative">
          {/*
            Two copies, one stack. The dirty one is the flow copy and carries
            the accessible text; the clean one is aria-hidden and masked to the
            track, so a screen reader hears the headline once.
          */}
          <h1 className="display-xl split-dirty relative max-w-[16ch]">
            {home.heroHeading}
            <span aria-hidden="true" className="split-clean absolute inset-0">
              {home.heroHeading}
            </span>
          </h1>

          <div className="font-spec mt-6 flex items-center gap-4 text-[11px] uppercase tracking-[0.28em] text-stone-050/60">
            <span>{connective.hero.before}</span>
            <span aria-hidden="true" className="h-px w-16 bg-stone-050/30" />
            <span className="text-teal-300">{connective.hero.after}</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t pt-6 md:flex-row md:items-end md:justify-between"
             style={{ borderColor: "var(--rule)" }}>
          <p className="max-w-sm text-lg text-stone-050">{home.heroBody}</p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-stone-400">
              {business.serviceArea.county}, {business.serviceArea.stateAbbr}
            </p>
            <A href={business.phone.href}
               className="whitespace-nowrap text-lg font-medium text-teal-300 underline underline-offset-4">
              {business.phone.display}
            </A>
            <A href="/quote" className="btn btn--paper">{pages.hero.getAFreeQuote}</A>
          </div>
        </div>
      </div>
    </section>
  );
}
