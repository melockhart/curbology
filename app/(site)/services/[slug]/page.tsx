import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { business, services } from "../../../../lib/content";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../../../components/ui";
import { A } from "../../../../components/link";
import { pageMetadata } from "../../../../lib/seo";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  const siblings = services.filter((s) => s.slug !== service.slug);

  return (
    <>
      <Section ground="teal">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Eyebrow>
              {business.serviceArea.county}, {business.serviceArea.stateAbbr}
            </Eyebrow>
            <h1 className="text-5xl">{service.name}</h1>
            <p className="mt-6 text-lg">{service.intro}</p>
            <div className="mt-8"><Button href="/contact" variant="onTeal">{service.cta}</Button></div>
          </div>
          <AwaitingPhoto label={`${service.name} — a real job, before and after.`} />
        </div>
      </Section>

      {service.includes.length > 0 && (
        <Section>
          <h2 className="text-4xl">What&rsquo;s included</h2>
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

      <Section ground={service.includes.length > 0 ? "teal" : "paper"}>
        <h2 className="text-4xl">The work</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <AwaitingPhoto label="Before." />
          <AwaitingPhoto label="After." />
        </div>
      </Section>

      {/*
        No pricing block. The live site publishes no prices, and a range invented
        here is a quote Tristen would have to honour or walk back.
      */}

      <Section>
        <h2 className="text-4xl">Other services</h2>
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

      <Section ground="ink">
        <h2 className="max-w-2xl text-4xl text-paper">
          Get a free quote for {service.name.toLowerCase()}
        </h2>
        <p className="mt-4 text-white/75">
          Or call{" "}
          <A href={business.phone.href} className="underline underline-offset-4">
            {business.phone.display}
          </A>
          .
        </p>
        <div className="mt-8"><Button href="/contact">Request a quote</Button></div>
      </Section>
    </>
  );
}
