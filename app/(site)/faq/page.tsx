import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { Button, Section } from "../../../components/ui";
import { A } from "../../../components/link";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/faq", { title: "Questions & pricing" });
}

/**
 * Answers are drawn only from what the live site actually states — service
 * descriptions, the service area, and the quote flow. Questions Tristen has not
 * answered anywhere are listed as open rather than invented, because a wrong
 * answer here is one he has to honour on the phone.
 *
 * No pricing section: the live site publishes none, and a made-up range is a
 * quote he would have to stand behind or walk back.
 */

export default async function FaqPage() {
  const { business, pages } = await siteContent();
  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">{pages.faq.questions}</h1>
      </Section>

      <Section cut="l" ground="shallow">
        <ul className="max-w-3xl divide-y divide-ink/10">
          {pages.faq.answered.map((item) => (
            <li key={item.q} className="py-6">
              <details>
                <summary className="cursor-pointer font-display text-xl font-bold">
                  {item.q}
                </summary>
                <p className="mt-3 text-[color:var(--muted)]">{item.a}</p>
              </details>
            </li>
          ))}
        </ul>

        {/* Visible in dev, and a standing to-do. Not shipped to production. */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-14 max-w-3xl rounded-xl border-2 border-dashed border-slate/30 p-6">
            <h2 className="font-display text-lg font-bold">{pages.faq.openWithTristen}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[color:var(--muted)]">
              {pages.faq.open.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>
        )}
      </Section>

      <Section cut="r" ground="ink">
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">{pages.faq.stillHaveAQuestion}</h2>
        <p className="mt-4 text-white/75">
          {pages.faq.call}{" "}
          <A href={business.phone.href} className="underline underline-offset-4">
            {business.phone.display}
          </A>
          .
        </p>
        <div className="mt-8"><Button href="/contact">{pages.faq.askUs}</Button></div>
      </Section>
    </>
  );
}
