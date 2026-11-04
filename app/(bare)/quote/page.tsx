import type { Metadata } from "next";
import { QuoteFlow } from "../../../components/quote/quote-flow";
import { business, services } from "../../../lib/content";

export const metadata: Metadata = {
  title: "Get your price",
  description: "Add your address and photos, and Curbology prices the job.",
};

/**
 * One address for the whole flow. The steps are states of one screen, so a
 * half-finished quote cannot be deep-linked into a step whose data is missing.
 */
export default function QuotePage() {
  return (
    <QuoteFlow
      phone={{ display: business.phone.display, href: business.phone.href }}
      services={services.map((service) => ({ slug: service.slug, name: service.name }))}
    />
  );
}
