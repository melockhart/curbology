import type { Metadata } from "next";
import { services } from "../../lib/content";
import { Button, Section, Eyebrow } from "../../components/ui";
import { A } from "../../components/link";

export const metadata: Metadata = { title: "Services" };

export default function ServicesIndex() {
  return (
    <>
      <Section ground="teal">
        <h1 className="max-w-3xl text-5xl">Exterior cleaning services</h1>
        <p className="mt-6 max-w-xl text-lg">
          Four services across Oakland County. Every one starts with a free quote.
        </p>
      </Section>

      <Section>
        <ul className="grid gap-x-10 gap-y-14 md:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug}>
              <Eyebrow>{s.name}</Eyebrow>
              <h2 className="text-3xl">
                <A href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-4">
                  {s.name}
                </A>
              </h2>
              <p className="mt-4 text-slate">{s.intro}</p>
              {s.includes.length > 0 && (
                <ul className="mt-5 space-y-2">
                  {s.includes.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="text-teal">✓</span>
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

      <Section ground="teal">
        <h2 className="max-w-2xl text-4xl">Not sure which one you need?</h2>
        <p className="mt-4 max-w-xl text-lg">
          Send a photo with your quote request. Most of the time that is enough to
          price the job without visiting.
        </p>
        <div className="mt-8"><Button href="/contact" variant="onTeal">Get a free quote</Button></div>
      </Section>
    </>
  );
}
