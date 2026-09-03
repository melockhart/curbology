import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { business } from "../../../lib/content";
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
const answered = [
  {
    q: "What areas do you cover?",
    a: `${business.serviceArea.county}, ${business.serviceArea.state}, including ${business.serviceArea.townsNamed.join(", ")}. If you are not sure, ask — we will tell you straight away.`,
  },
  {
    q: "Will pressure washing damage my siding?",
    a: "Not the way we do it. Siding is cleaned with low-pressure soft washing, which is safe for vinyl, brick, wood and stucco. High pressure is for concrete, brick and stone — driveways, patios and walkways.",
  },
  {
    q: "Are your cleaning solutions safe?",
    a: "Yes. We use eco-friendly cleaning solutions that are safe for the surrounding area on both our pressure washing and soft wash services.",
  },
  {
    q: "How do I get a price?",
    a: "Send a quote request with a photo or two of the area. Most of the time that is enough to give you a real number without visiting.",
  },
  {
    q: "What does gutter brightening actually do?",
    a: "It goes beyond clearing debris. Brightening removes the 'tiger stripes' and oxidation from the face of the gutter, so they look new rather than merely clear.",
  },
];

/** Open with Tristen — deliberately not answered here. */
const open = [
  "Pricing, or a starting-at figure per service",
  "How far ahead bookings usually run",
  "Whether anyone needs to be home during the work",
  "Licence and insurance details",
  "Business hours",
];

export default function FaqPage() {
  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">Questions</h1>
      </Section>

      <Section cut="l" ground="shallow">
        <ul className="max-w-3xl divide-y divide-ink/10">
          {answered.map((item) => (
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
            <h2 className="font-display text-lg font-bold">Open with Tristen</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[color:var(--muted)]">
              {open.map((q) => <li key={q}>{q}</li>)}
            </ul>
          </div>
        )}
      </Section>

      <Section cut="r" ground="ink">
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">Still have a question?</h2>
        <p className="mt-4 text-white/75">
          Call{" "}
          <A href={business.phone.href} className="underline underline-offset-4">
            {business.phone.display}
          </A>
          .
        </p>
        <div className="mt-8"><Button href="/contact">Ask us</Button></div>
      </Section>
    </>
  );
}
