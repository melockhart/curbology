import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { Button, Section, Eyebrow } from "../../../components/ui";
import { A } from "../../../components/link";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/services", { title: "Services" });
}

export default async function ServicesIndex() {
  const { services, pages } = await siteContent();
  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">{pages.servicesIndex.exteriorCleaningServices}</h1>
        <p className="mt-6 max-w-xl text-lg">
          {pages.servicesIndex.fourServicesAcrossOakland}
        </p>
      </Section>

      <Section cut="l" ground="shallow">
        <ul className="grid gap-x-10 gap-y-14 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug}>
              <Eyebrow>{s.name}</Eyebrow>
              <h2 className="text-3xl">
                <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                  {s.name}
                </A>
              </h2>
              <p className="mt-4 text-[color:var(--muted)]">{s.intro}</p>
              {s.includes.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {s.includes.map((item) => (
                    <li key={item} className="flex gap-3">
                      {/* Not text-teal: teal at body size on white is 2.45:1. */}
                      <span aria-hidden="true">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-6"><Button href={`/services/${s.slug}`}>{s.cta}</Button></div>
            </li>
          ))}
        </ul>
      </Section>

      <Section cut="r" ground="teal">
        <h2 data-wash-type className="max-w-2xl text-4xl">{pages.servicesIndex.notSureWhichOne}</h2>
        <p className="mt-4 max-w-xl text-lg">
          {pages.servicesIndex.sendAPhotoWith}
        </p>
        <div className="mt-8"><Button href="/quote" variant="onTeal">{pages.servicesIndex.getAFreeQuote}</Button></div>
      </Section>
    </>
  );
}
