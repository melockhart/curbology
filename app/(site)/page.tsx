import type { Metadata } from "next";
import { pageMetadata } from "../../lib/seo";
import { siteContent } from "../../lib/cms";
import { Hero } from "../../components/hero";
import { Section, ProofBand, AwaitingPhoto } from "../../components/ui";
import { A } from "../../components/link";
import { Reveal } from "../../components/motion/reveal";
import { Caustics } from "../../components/motion/caustics";
import { BeforeAfter } from "../../components/motion/before-after";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/", {});
}

export default async function HomePage() {
  const { business, home, services, connective, pages } = await siteContent();
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
            <h2 data-wash-type className="display-lg mt-4">{pages.home.fourServices}<br />{pages.home.oneCrew}</h2>
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
              {pages.home.before}<br />{pages.home.andAfter}
            </h2>
            <p className="mt-6 max-w-sm text-stone-050/85">
              {connective.sections.difference.lead}
            </p>
            <p className="mt-8">
              <A href="/gallery" className="text-teal-300 underline underline-offset-8">
                {pages.home.seeMoreOfOur}
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
            <h2 data-wash-type className="display-lg mt-4">{pages.home.threeSteps}<br />{pages.home.noSurprises}</h2>
            <p className="mt-5 max-w-xs text-[color:var(--muted)]">
              {connective.sections.method.lead}
            </p>
          </div>

          <ol className="col-span-12 mt-12 md:col-span-6 md:col-start-7 md:mt-0">
            {pages.home.steps.map((step, i) => (
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
              <A href="/about" className="underline underline-offset-8">{pages.home.moreAboutUs}</A>
            </p>
          </div>
          <div className="col-span-12 self-center lg:col-span-4 lg:col-start-9">
            <AwaitingPhoto label={pages.home.theOwnerOnA} />
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
              <A href="/quote" className="btn btn--paper">{pages.home.getAFreeQuote}</A>
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
