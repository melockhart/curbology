import { business, home, services } from "../../lib/content";
import { Hero } from "../../components/hero";
import { Cinema } from "../../components/motion/cinema";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../components/ui";
import { A } from "../../components/link";
import { Reveal } from "../../components/motion/reveal";
import { Magnetic } from "../../components/motion/magnetic";
import { BeforeAfter } from "../../components/motion/before-after";

/**
 * Section order follows the /site-build standard inventory:
 *   bleedHero → featureGrid → beforeAfter → pinnedSteps → localVoice → magneticCta
 *
 * Motion is applied per section rather than globally, so each one can say why it
 * moves. Nothing above the fold waits on script: the headline, the phone number
 * and the quote button are in the server HTML and visible without JS.
 *
 * The live site's `countedStats` band is absent on purpose. It read
 * "300+ Projects Completed · 3+ Years of Expertise · 100% Customer Satisfaction"
 * and Tristen does not know where those numbers came from. No source, no claim.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      {/* featureGrid — staggered, so the eye is led down the list */}
      <Section>
        <Reveal><Eyebrow>What we clean</Eyebrow></Reveal>
        <Reveal delay={60}>
          <h2 className="display-lg max-w-2xl">Four services,<br />one crew</h2>
        </Reveal>
        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal as="li" key={s.slug} delay={140 + i * 90}>
              <div className="border-t border-ink/10 pt-6">
                <h3 className="text-2xl">
                  <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                    {s.name}
                  </A>
                </h3>
                <p className="mt-3 text-[color:var(--muted)]">{s.intro}</p>
                <p className="mt-4">
                  <A href={`/services/${s.slug}`} className="font-medium underline underline-offset-4">
                    {s.cta}
                  </A>
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </Section>

      {/* beforeAfter — the proof this industry runs on, and the one element
          worth building as a real mechanism rather than two images side by side */}
      <Section ground="teal" grain>
        <Reveal><Eyebrow>The difference</Eyebrow></Reveal>
        <Reveal delay={60}><h2 className="display-lg max-w-2xl">Before<br />and after</h2></Reveal>
        <Reveal delay={140}>
          <Cinema className="mt-10">
            <BeforeAfter
              beforeAlt="Before cleaning" afterAlt="After cleaning"
              caption="Drag to compare. A matched pair — same house, same angle, same light."
            />
          </Cinema>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-8">
            <A href="/gallery" className="font-medium underline underline-offset-4">See more of our work</A>
          </p>
        </Reveal>
      </Section>

      {/* pinnedSteps — the column holds while the steps advance beside it.
          Pure sticky: no scroll listener, so it costs nothing. */}
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div className="md:sticky md:top-24 md:self-start">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="display-lg">Three steps,<br />no surprises</h2>
            <p className="mt-4 text-[color:var(--muted)]">
              Most quotes come back the same day.
            </p>
          </div>
          <ol className="space-y-16">
            {[
              ["01", "Send a photo", "A picture of the driveway, the siding, the roofline — whatever needs doing. Most of the time that is enough to price it."],
              ["02", "Get a real number", "Not a range designed to change once we arrive. If we do need to see it first, we will say so."],
              ["03", "We clean it", "You do not need to be home. We leave when it looks the way it did the day it was built."],
            ].map(([n, title, body], i) => (
              <Reveal as="li" key={n} delay={i * 90}>
                <div>
                  <span className="font-display text-5xl font-bold text-[color:var(--muted)]">{n}</span>
                  <h3 className="mt-3 text-2xl">{title}</h3>
                  <p className="mt-2 text-[color:var(--muted)]">{body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      {/* about — verbatim from the live site */}
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="text-4xl">{home.aboutHeading}</h2>
              <p className="mt-6 text-lg text-[color:var(--muted)]">{home.aboutBody}</p>
              <p className="mt-6">
                <A href="/about" className="font-medium underline underline-offset-4">More about us</A>
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <AwaitingPhoto label="The owner, on a job. A face is why a stranger lets someone onto their property." />
          </Reveal>
        </div>
      </Section>

      {/* localVoice — towns as text; this is what local search reads */}
      <Section ground="ink" grain>
        <Reveal><Eyebrow>Where we work</Eyebrow></Reveal>
        <Reveal delay={60}>
          <h2 className="max-w-2xl text-4xl text-paper">
            {business.serviceArea.county}, {business.serviceArea.state}
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-6 max-w-xl text-white/75">
            Including {business.serviceArea.townsNamed.join(", ")}.{" "}
            <A href="/service-area" className="underline underline-offset-4">Check your town</A>.
          </p>
        </Reveal>
      </Section>

      {/* magneticCta — same action as the hero */}
      <Section ground="teal" grain>
        <div className="max-w-2xl">
          <Reveal><h2 className="display-lg max-w-3xl">{home.quoteHeading}</h2></Reveal>
          <Reveal delay={80}><p className="mt-4 text-lg">{home.quoteSub}</p></Reveal>
          <Reveal delay={160}>
            <div className="mt-8">
              <Magnetic>
                <Button href="/contact" variant="onTeal">Get a free quote</Button>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
