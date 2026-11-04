import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteContent } from "../../../../lib/cms";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../../../components/ui";
import { A } from "../../../../components/link";
import { pageMetadata } from "../../../../lib/seo";

export async function generateStaticParams() {
  const { services } = await siteContent();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { business, services } = await siteContent();
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return pageMetadata(`/services/${slug}`, {
    title: `${service.name} in ${business.serviceArea.county}, ${business.serviceArea.stateAbbr}`,
    description: service.intro.slice(0, 155),
  });
}

/**
 * One page per service — the local-search play, and the reason each needs its own
 * copy rather than the service name find-and-replaced.
 *
 * Every page cross-links to its siblings. It is the cheapest ranking work there
 * is and most small-business sites skip it.
 */
export default async function ServicePage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { business, services, pages, images } = await siteContent();
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const siblings = services.filter((s) => s.slug !== service.slug);

  const hasIncludes = service.includes.length > 0;
  const workGround = hasIncludes ? "paper" : "shallow";

  return (
    <>
      <Section cut={false} ground="teal">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>
              {business.serviceArea.county}, {business.serviceArea.stateAbbr}
            </Eyebrow>
            <h1 data-wash-type className="text-5xl">{service.name}</h1>
            <p className="mt-6 text-lg">{service.intro}</p>
            <div className="mt-8"><Button href={`/quote?service=${service.slug}`} variant="onTeal">{service.cta}</Button></div>
          </div>
          <AwaitingPhoto label={`${service.name} — a real job, before and after.`} image={images[`service.${service.slug}`]} />
        </div>
      </Section>

      {/*
        The grounds below are derived from `hasIncludes`, not written twice.
        They were: one section's ground was conditional while the next section's
        `washFrom` was a literal, so on a service with nothing to list the edge
        painted a colour that was not on the page — a 132px band of the wrong
        ground across the top of the section. A wash edge must name the ground
        that is actually above it, which means the two have to come from the
        same expression.
      */}
      {hasIncludes && (
        <Section cut="l" ground="shallow">
          <h2 data-wash-type className="text-4xl">{pages.servicePage.whatSIncluded}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-3 border-t border-ink/10 pt-4">
                {/* Not text-teal: teal at body size on white is 2.45:1. */}
                      <span aria-hidden="true">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section cut="r" ground={workGround}>
        <h2 data-wash-type className="text-4xl">{pages.servicePage.theWork}</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <AwaitingPhoto label={pages.servicePage.before} />
          <AwaitingPhoto label={pages.servicePage.after} />
        </div>
      </Section>

      {/*
        No pricing block. The live site publishes no prices, and a range invented
        here is a quote Tristen would have to honour or walk back.
      */}

      <Section cut="l" ground="teal">
        <h2 data-wash-type className="text-4xl">{pages.servicePage.otherServices}</h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {siblings.map((s) => (
            <li key={s.slug} className="border-t border-ink/10 pt-5">
              <h3 className="text-xl">
                <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                  {s.name}
                </A>
              </h3>
            </li>
          ))}
        </ul>
      </Section>

      <Section cut="r" ground="ink">
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">
          {pages.servicePage.getAFreeQuote}{" "}{service.name.toLowerCase()}
        </h2>
        <p className="mt-4 text-white/75">
          {pages.servicePage.orCall}{" "}
          <A href={business.phone.href} className="underline underline-offset-4">
            {business.phone.display}
          </A>
          .
        </p>
        <div className="mt-8"><Button href={`/quote?service=${service.slug}`}>{pages.servicePage.requestAQuote}</Button></div>
      </Section>
    </>
  );
}
