import type { Metadata } from "next";
import { business } from "../../../lib/content";
import { Button, Section } from "../../../components/ui";

export const metadata: Metadata = {
  title: `Service area — ${business.serviceArea.county}, ${business.serviceArea.stateAbbr}`,
};

/**
 * Towns as text, not only on a map — text is what local search reads.
 *
 * Only West Bloomfield is named anywhere on the live site, so that is the only
 * town listed. A plausible list of Oakland County towns would be invented, and
 * per-town pages built on invented content are a doorway-page pattern.
 */
export default function ServiceAreaPage() {
  return (
    <>
      <Section ground="teal">
        <h1 className="max-w-3xl text-5xl">
          Serving {business.serviceArea.county}, {business.serviceArea.state}
        </h1>
      </Section>

      <Section>
        <h2 className="text-4xl">Towns we work in</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {business.serviceArea.townsNamed.map((town) => (
            <li key={town} className="rounded-full border border-ink/20 px-4 py-2">
              {town}, {business.serviceArea.stateAbbr}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-xl text-slate">
          Not listed? We cover {business.serviceArea.county} broadly — ask and
          we will tell you straight away.
        </p>
        <div className="mt-8"><Button href="/contact">Check your address</Button></div>
      </Section>
    </>
  );
}
