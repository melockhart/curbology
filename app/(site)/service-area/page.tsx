import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { business } from "../../../lib/content";
import { Button, Section } from "../../../components/ui";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/service-area", {
  title: `Service area — ${business.serviceArea.county}, ${business.serviceArea.stateAbbr}`,
});
}

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
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">
          Serving {business.serviceArea.county}, {business.serviceArea.state}
        </h1>
      </Section>

      <Section cut="l" ground="shallow">
        <h2 data-wash-type className="text-4xl">Towns we work in</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {business.serviceArea.townsNamed.map((town) => (
            <li key={town} className="rounded-lg border border-ink/20 px-4 py-2">
              {town}, {business.serviceArea.stateAbbr}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-xl text-[color:var(--muted)]">
          Not listed? We cover {business.serviceArea.county} broadly — ask and
          we will tell you straight away.
        </p>
        <div className="mt-8"><Button href="/quote">Check your address</Button></div>
      </Section>
    </>
  );
}
