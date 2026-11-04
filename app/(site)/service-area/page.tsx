import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { Button, Section } from "../../../components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await siteContent();
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
export default async function ServiceAreaPage() {
  const { business, pages } = await siteContent();
  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">
          {pages.serviceArea.serving}{" "}{business.serviceArea.county}, {business.serviceArea.state}
        </h1>
      </Section>

      <Section cut="l" ground="shallow">
        <h2 data-wash-type className="text-4xl">{pages.serviceArea.townsWeWorkIn}</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {business.serviceArea.townsNamed.map((town) => (
            <li key={town} className="rounded-lg border border-ink/20 px-4 py-2">
              {town}, {business.serviceArea.stateAbbr}
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-xl text-[color:var(--muted)]">
          {pages.serviceArea.notListedWeCover}{" "}{business.serviceArea.county} {pages.serviceArea.broadlyAskAndWe}
        </p>
        <div className="mt-8"><Button href="/quote">{pages.serviceArea.checkYourAddress}</Button></div>
      </Section>
    </>
  );
}
