import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";
import { business, home, services, connective } from "../../lib/content";
import { Hero } from "../../components/hero";
import { Section, ProofBand, AwaitingPhoto } from "../../components/ui";
import { A } from "../../components/link";
import { Reveal } from "../../components/motion/reveal";
import { Caustics } from "../../components/motion/caustics";
import { BeforeAfter } from "../../components/motion/before-after";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/", {});
}

/**
 * The home page, composed on the lane's angle.
 *
 * What changed, and why. The previous version was seven full-width bands, each
 * a solid fill with its content in the same centred box, every heading starting
 * at the same left margin. That is a template with a good palette on it — the
 * structure did not change when the design did.
 *
 * This is built on three moves instead:
 *
 *   THE ANGLE. Every boundary is cut on the lane's slope, alternating, and
 *   sections climb into the one above so they interlock rather than stack.
 *
 *   OVERLAP. Plates and figures cross the boundaries. The proof plate hangs
 *   into the hero; the step numerals run out past the text column; the closing
 *   headline starts on one ground and finishes on the next. Nothing sits
 *   politely inside its own band.
 *
 *   ASYMMETRY. Content spans odd tracks of a twelve-column grid and changes
 *   alignment down the page, so the eye is led rather than marched.
 *
 * The copy is unchanged where it is factual — every claim is still verbatim
 * from the live Wix capture. The kickers and leads are new and are language
 * only: nothing in `connective` asserts anything Tristen could be held to.
 */
const steps = [
  { n: "01", title: "Send a photo", body: "A picture of the driveway, the siding, the roofline — whatever needs doing. Most of the time that is enough to price it." },
  { n: "02", title: "Get a real number", body: "Not a range designed to change once we arrive. If we do need to see it first, we will say so." },
  { n: "03", title: "We clean it", body: "You do not need to be home. We leave when it looks the way it did the day it was built." },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      {/*
        The proof plate hangs into the hero. It is the first overlap on the
        page and it is doing a job as well as a look: the checkable facts sit
        on the fold rather than below it.
      */}
      <Section ground="shallow" cut="l" margin={connective.margin.services}>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="chamfer col-span-12 -mt-[calc(var(--cut)+4.5rem)] bg-paper px-6 py-8 shadow-[0_30px_80px_-40px_rgb(5_60_64_/_0.55)] md:col-span-11 md:px-10 md:py-10 lg:col-span-10">
            <p className="font-spec mb-6 text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {connective.sections.proof.kicker}
            </p>
            <ProofBand
              items={[
                { label: "What we clean", value: `${services.length} services`,
                  note: services.map((s) => s.name).join(" · ") },
                { label: "Where we work", value: business.serviceArea.county,
                  note: business.serviceArea.townsNamed.length
                    ? business.serviceArea.townsNamed.join(" · ")
                    : business.serviceArea.state },
                { label: "Talk to us", value: business.phone.display,
                  note: "Call or text — quotes are free." },
              ]}
            />
          </div>
        </div>

        {/* Services. The heading sits in the left four tracks and the list runs
            the right seven, so the two read as one composition rather than as a
            heading with a grid under it. */}
        <div className="mt-24 grid grid-cols-12 gap-x-6 gap-y-10 md:mt-32">
          <div className="col-span-12 md:col-span-5 md:sticky md:top-32 md:self-start">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {connective.sections.services.kicker}
            </p>
            <h2 data-wash-type className="display-lg mt-4">Four services,<br />one crew</h2>
            <p className="mt-5 max-w-xs text-[color:var(--muted)]">
              {connective.sections.services.lead}
            </p>
          </div>

          <ul className="col-span-12 md:col-span-6 md:col-start-7">
            {services.map((s, i) => (
              <Reveal key={s.slug} delay={i * 70}>
                <li className="border-t py-7" style={{ borderColor: "var(--rule)" }}>
                  <div className="flex items-baseline gap-5">
                    <span className="font-spec shrink-0 text-[11px] tabular-nums text-[color:var(--muted)]">
                      0{i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-bold md:text-3xl">
                        <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                          {s.name}
                        </A>
                      </h3>
                      <p className="mt-3 max-w-prose text-[color:var(--muted)]">{s.intro}</p>
                    </div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/*
        The difference. Deep water with live caustics, and the headline runs off
        the left edge of the canvas — the one place on the page where type is
        allowed to leave.
      */}
      <Section ground="deep" cut="r" margin={connective.margin.difference} tall>
        <Caustics ground="#053c40" light="#5ad4d5" intensity={0.5} scale={4}
                  staticSrc="/brand/caustics-deep.jpg" />
        <div aria-hidden="true" className="grain-layer absolute inset-0 z-[1]" />

        <div className="relative z-[3] grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-5">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-stone-400">
              {connective.sections.difference.kicker}
            </p>
            <h2 data-wash-type
                className="display-lg mt-4 -ml-[6vw] whitespace-nowrap md:-ml-[8vw]">
              Before<br />and after
            </h2>
            <p className="mt-6 max-w-sm text-stone-050/85">
              {connective.sections.difference.lead}
            </p>
            <p className="mt-8">
              <A href="/gallery" className="text-teal-300 underline underline-offset-8">
                See more of our work
              </A>
            </p>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7">
            <BeforeAfter
              beforeAlt="The same surface before cleaning"
              afterAlt="The same surface after cleaning"
              caption="Drag to compare. A matched pair — same house, same angle, same light."
            />
          </div>
        </div>
      </Section>

      {/*
        Method. The numerals are set enormous and hang out past the text column
        into the left margin — the clearest overlap on the page and the reason
        the grid is twelve tracks rather than a two-column split.
      */}
      <Section ground="paper" cut="l" margin={connective.margin.method}>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 md:col-span-5 md:sticky md:top-32 md:self-start">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {connective.sections.method.kicker}
            </p>
            <h2 data-wash-type className="display-lg mt-4">Three steps,<br />no surprises</h2>
            <p className="mt-5 max-w-xs text-[color:var(--muted)]">
              {connective.sections.method.lead}
            </p>
          </div>

          <ol className="col-span-12 mt-12 md:col-span-6 md:col-start-7 md:mt-0">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 90}>
                {/*
                  The numeral is generated content, not a DOM node. It is pure
                  ornament — the <ol> already carries the order — and ornament
                  in the DOM as text is wrong twice: a screen reader reads the
                  count twice, and the contrast sweep quite correctly failed a
                  160px figure sitting at 1.13:1. Decoration belongs in ::before.
                */}
                <li data-n={step.n} className="step relative border-t pt-8 pb-12"
                    style={{ borderColor: "var(--rule)" }}>
                  <h3 className="relative font-display text-2xl font-bold">{step.title}</h3>
                  <p className="relative mt-3 max-w-prose text-[color:var(--muted)]">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </Section>

      {/* Who turns up. Asymmetric the other way, so the page stops alternating
          predictably. */}
      <Section ground="teal" cut="r">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {connective.sections.about.kicker}
            </p>
            <h2 data-wash-type className="display-lg mt-4 max-w-[13ch]">{home.aboutHeading}</h2>
            <p className="mt-6 max-w-xl text-lg">{home.aboutBody}</p>
            <p className="mt-8">
              <A href="/about" className="underline underline-offset-8">More about us</A>
            </p>
          </div>
          <div className="col-span-12 self-center lg:col-span-4 lg:col-start-9">
            <AwaitingPhoto label="The owner, on a job. A face is why a stranger lets someone onto their property." />
            <p className="font-spec mt-6 text-[11px] uppercase tracking-[0.24em]">
              {connective.sections.area.kicker}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">
              {business.serviceArea.county}, {business.serviceArea.state}
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              {business.serviceArea.townsNamed.length
                ? `Including ${business.serviceArea.townsNamed.join(", ")}.`
                : connective.sections.area.lead}
            </p>
          </div>
        </div>
      </Section>

      {/*
        The close. The headline is set to run past the section's own top edge so
        it starts on the teal above and finishes on the ink — the last and
        largest overlap on the page.
      */}
      <Section ground="ink" cut="l" margin={connective.margin.quote} tall>
        <div className="grid grid-cols-12 gap-x-6">
          <div className="col-span-12 lg:col-span-9">
            <p className="font-spec text-[11px] uppercase tracking-[0.24em] text-stone-400">
              {connective.sections.quote.kicker}
            </p>
            <h2 data-wash-type className="display-lg mt-4 max-w-[14ch]">{home.quoteHeading}</h2>
            <p className="mt-6 max-w-md text-lg text-stone-050/85">{home.quoteSub}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <A href="/contact" className="btn btn--paper">Get a free quote</A>
              <A href={business.phone.href}
                 className="font-display text-2xl font-bold text-teal-300 underline underline-offset-8">
                {business.phone.display}
              </A>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
