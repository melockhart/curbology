import { business, home, services } from "../../lib/content";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../components/ui";
import { A } from "../../components/link";

/**
 * Section order follows the /site-build standard inventory:
 *   bleedHero → featureGrid → beforeAfter → pinnedSteps → localVoice → magneticCta
 *
 * The live site's `countedStats` band is absent on purpose. It read
 * "300+ Projects Completed · 3+ Years of Expertise · 100% Customer Satisfaction"
 * and Tristen does not know where those numbers came from. No source, no claim.
 */
export default function HomePage() {
  return (
    <>
      {/* bleedHero */}
      <Section ground="teal">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="text-5xl md:text-6xl">{home.heroHeading}</h1>
            <p className="mt-6 max-w-md text-lg">{home.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/contact" variant="onTeal">Get a free quote</Button>
              <A href={business.phone.href} className="inline-flex min-h-[44px] items-center font-medium underline underline-offset-4">
                Call {business.phone.display}
              </A>
            </div>
          </div>
          <AwaitingPhoto label="The hero shot — a real job, in Oakland County." />
        </div>
      </Section>

      {/* featureGrid — every service links to its own page */}
      <Section>
        <Eyebrow>What we clean</Eyebrow>
        <h2 className="max-w-2xl text-4xl">Four services, one crew</h2>
        <ul className="mt-12 grid gap-8 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug} className="border-t border-ink/10 pt-6">
              <h3 className="text-2xl">
                <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                  {s.name}
                </A>
              </h3>
              <p className="mt-3 text-slate">{s.intro}</p>
              <p className="mt-4">
                <A href={`/services/${s.slug}`} className="font-medium underline underline-offset-4">
                  {s.cta}
                </A>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* beforeAfter — the proof this industry actually runs on */}
      <Section ground="teal">
        <Eyebrow>The difference</Eyebrow>
        <h2 className="max-w-2xl text-4xl">Before and after</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <AwaitingPhoto label="Before — same house, same angle." />
          <AwaitingPhoto label="After — same house, same angle." />
        </div>
        <p className="mt-8">
          <A href="/gallery" className="font-medium underline underline-offset-4">See more of our work</A>
        </p>
      </Section>

      {/* about — verbatim from the live site */}
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl">{home.aboutHeading}</h2>
            <p className="mt-6 text-lg text-slate">{home.aboutBody}</p>
            <p className="mt-6">
              <A href="/about" className="font-medium underline underline-offset-4">More about us</A>
            </p>
          </div>
          <AwaitingPhoto label="The owner, on a job. A face is why a stranger lets someone onto their property." />
        </div>
      </Section>

      {/* localVoice — towns as text; this is what local search reads */}
      <Section ground="ink">
        <Eyebrow>Where we work</Eyebrow>
        <h2 className="max-w-2xl text-4xl text-paper">
          {business.serviceArea.county}, {business.serviceArea.state}
        </h2>
        <p className="mt-6 max-w-xl text-white/75">
          Including {business.serviceArea.townsNamed.join(", ")}.{" "}
          <A href="/service-area" className="underline underline-offset-4">
            Check your town
          </A>
          .
        </p>
      </Section>

      {/* magneticCta — same action as the hero */}
      <Section ground="teal">
        <div className="max-w-2xl">
          <h2 className="text-4xl">{home.quoteHeading}</h2>
          <p className="mt-4 text-lg">{home.quoteSub}</p>
          <div className="mt-8"><Button href="/contact" variant="onTeal">Get a free quote</Button></div>
        </div>
      </Section>
    </>
  );
}
