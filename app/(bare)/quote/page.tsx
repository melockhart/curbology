import type { Metadata } from "next";
import { QuoteFlow } from "../../../components/quote/quote-flow";
import { siteContent } from "../../../lib/cms";

export const metadata: Metadata = {
  title: "Get your price",
  description: "Add your address and photos, and Curbology prices the job.",
};

/**
 * One address for the whole flow. The steps are states of one screen, so a
 * half-finished quote cannot be deep-linked into a step whose data is missing.
 */
export default async function QuotePage() {
  const { business, services, pages } = await siteContent();
  return (
    <QuoteFlow
      phone={{ display: business.phone.display, href: business.phone.href }}
      copy={pages.quote}
      services={services.map((service) => ({ slug: service.slug, name: service.name }))}
    />
  );
}
