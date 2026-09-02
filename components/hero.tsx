import { business, home } from "../lib/content";
import { A } from "./link";
import { HeroMedia } from "./motion/hero-media";
import { Kinetic } from "./motion/kinetic";

/**
 * Open-centre hero: type in a band along the top, meta along the bottom, and
 * the whole middle given over to media.
 *
 * The bands are the layout, not an overlay — the media sits in the gap between
 * them rather than behind them, so nothing is ever type-on-video fighting for
 * contrast. That is deliberate: a headline over footage is the single most
 * common place a site fails AA, and there is no amount of scrim that makes it
 * reliable across every frame of a loop.
 *
 * Everything that converts is in the bottom band and in the server HTML: the
 * phone number and the quote button. Neither waits on the canvas, the video, or
 * any script.
 */
export function Hero() {
  return (
    <section className="grain relative bg-teal text-ink">
      <div className="mx-auto flex min-h-[calc(100svh-5.5rem)] w-full max-w-[1600px] flex-col px-6 py-8 md:py-10">

        {/* Top band — the headline, at display scale, allowed to be big */}
        <div className="shrink-0">
          <h1 className="display-xl max-w-[15ch]" aria-label={home.heroHeading}>
            <Kinetic text={home.heroHeading} />
          </h1>
        </div>

        {/* The open centre */}
        <div className="relative my-6 min-h-[16vh] flex-1 overflow-hidden rounded-3xl md:my-8">
          <HeroMedia label="Curbology cleaning a home exterior in Oakland County" />
        </div>

        {/* Bottom band — everything that converts */}
        <div className="flex shrink-0 flex-col gap-6 border-t border-ink/20 pt-6 md:flex-row md:items-end md:justify-between">
          <p className="max-w-sm text-lg">{home.heroBody}</p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <p className="text-sm uppercase tracking-[0.16em]">
              {business.serviceArea.county}, {business.serviceArea.stateAbbr}
            </p>
            <A href={business.phone.href} className="whitespace-nowrap text-lg font-medium underline underline-offset-4">
              {business.phone.display}
            </A>
            <A href="/contact" className="btn btn--paper">Get a free quote</A>
          </div>
        </div>
      </div>
    </section>
  );
}
