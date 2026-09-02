import type { Metadata } from "next";
import { business } from "./content";

/**
 * Shared by both root layouts. The site has two: one with chrome, one without.
 * See app/(bare)/layout.tsx for why.
 *
 * The live site's title was the lowercase, brandless "professional exterior
 * cleaning services", and its og:description truncated the business name to
 * "Curbology Exterior C". Both are fixed here.
 */
export const siteMetadata: Metadata = {
  title: {
    default: `${business.name} — Pressure washing in ${business.serviceArea.county}, ${business.serviceArea.stateAbbr}`,
    template: `%s — ${business.name}`,
  },
  description: `Pressure washing, soft washing, gutter cleaning and roof cleaning across ${business.serviceArea.county}, ${business.serviceArea.state}. Free quotes.`,
  openGraph: { type: "website", siteName: business.name },
};
