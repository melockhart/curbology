/**
 * Every string here is verbatim from the live Wix site unless the comment above
 * it says otherwise. Captured 2026-09-02 from the rendered DOM.
 *
 * The rule this file exists to enforce: nothing reaches a page that did not come
 * from the capture or from Tristen. Where the site said something untrue, the
 * value is `null` and the reason is recorded — never replaced with a guess.
 */

export const business = {
  /**
   * The header badge reads "CURBOLOGY EXTERIOR SERVICES"; the copyright line and
   * the domain both say "Curbology Exterior Cleaning". The badge is the canonical
   * mark (client's call, 2026-09-02) but the text name follows the domain.
   * Unreconciled — flagged in the README.
   */
  name: "Curbology Exterior Cleaning",
  markWordmark: "Curbology Exterior Services",

  /**
   * PROVISIONAL. Tristen assumes this is current but has not confirmed it.
   * Evidence: it is the only number on the live site carrying a real tel: link.
   * The footer's (517) 555-0123 was a reserved fictional number and is gone.
   */
  phone: { display: "(248) 387-9215", href: "tel:+12483879215", confirmed: false },

  /** Not published anywhere on the live site. The quote form is the contact route. */
  email: null,

  /** Pending from Tristen. Blocks the email shells — CAN-SPAM requires one. */
  postalAddress: null,

  /** Not published anywhere on the live site. */
  hours: null,

  serviceArea: {
    county: "Oakland County",
    state: "Michigan",
    stateAbbr: "MI",
    /** The only town the live site names. Not a full service-area list. */
    townsNamed: ["West Bloomfield"],
  },

  /**
   * Dropped 2026-09-02. All six links on the live site pointed at platform
   * homepages (facebook.com, instagram.com, x.com, …) rather than any Curbology
   * profile. A dead icon is worse than no icon. Restore when Tristen supplies
   * real profile URLs.
   */
  socials: [] as Array<{ platform: string; href: string }>,

  /** Aggregate only. Individual review text and reviewer names were not captured. */
  googleRating: { value: 5.0, count: 10 },
} as const;

/**
 * REMOVED, not relocated: the homepage stat band read
 * "300+ Projects Completed · 3+ Years of Expertise · 100% Customer Satisfaction".
 * Tristen does not know where those numbers came from (2026-09-02), so they are
 * not claims this site can make. If evidence turns up, they go back on the home
 * page as a `countedStats` section.
 */

export const nav = [
  { label: "Services", href: "/services" },
  { label: "Gallery", href: "/gallery" },
  { label: "Reviews", href: "/reviews" },
  { label: "Service Area", href: "/service-area" },
  { label: "About", href: "/about" },
] as const;

export const home = {
  /** Verbatim. */
  heroHeading: "Professional exterior cleaning services in Oakland County",
  heroBody:
    "We deliver expert pressure washing and roof maintenance services across Oakland County, Michigan, restoring your home's exterior to its original pristine condition.",
  aboutHeading: "Professional exterior cleaning services",
  /**
   * Verbatim, and flagged: "artisanal precision to every surface" is the wrong
   * register for pressure washing and reads as generated. Kept until Tristen
   * approves a rewrite — replacing it silently would be inventing copy.
   */
  aboutBody:
    "We are dedicated to providing professional exterior care across Oakland County. Our team brings artisanal precision to every surface, ensuring your property maintains its pristine condition with the highest standards of cleanliness and care.",
  quoteHeading: "Get Your Free Exterior Cleaning Quote",
  quoteSub: "Fast and professional quotes delivered straight to you.",
} as const;

export type Service = {
  slug: string;
  name: string;
  /** The heading as it ran on the live site, where one existed. */
  sourceName: string | null;
  cta: string;
  intro: string;
  includes: readonly string[];
  /** Set only where the client publishes a price. Never inferred. */
  price: null;
  thin?: string;
};

export const services: readonly Service[] = [
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    sourceName: "Pressure Washing Oakland County MI",
    cta: "Book Service",
    intro:
      "Restore your surfaces to their original glory with professional pressure washing in Oakland County, MI. Our high-powered service removes years of built-up grime, mold, and stains from driveways, patios, and walkways—boosting your property's curb appeal and helping surfaces last longer.",
    includes: [
      "Deep cleans concrete, brick, and stone surfaces",
      "Eliminates slippery algae and hazardous mold growth",
      "Eco-friendly cleaning solutions safe for surroundings",
      "Increases property value and visual appeal",
    ],
    price: null,
  },
  {
    /**
     * Retitled. The live site ran two services both headed "Pressure Washing
     * Oakland County MI" — two pages competing for one keyword, and a visitor
     * cannot tell them apart. The body copy is untouched.
     */
    slug: "house-siding-washing",
    name: "House & Siding Soft Wash",
    sourceName: "Pressure Washing Oakland County MI – House & Siding Washing",
    cta: "Get Quote",
    intro:
      "Protect your investment and boost your curb appeal with our specialized low-pressure house washing. We safely remove organic growth, dirt, and stains from all siding types without the risk of damage, keeping your Oakland County home pristine.",
    includes: [
      "Safe Low-Pressure Soft Wash Technology",
      "Effective Removal of Mold, Mildew & Algae",
      "Safe for All Siding: Vinyl, Brick, Wood & Stucco",
      "Eco-Friendly Cleaning Solutions",
    ],
    price: null,
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning & Brightening",
    sourceName: "Gutter Cleaning - Brightening",
    cta: "Refresh My Gutters",
    intro:
      "Functional and beautiful, your gutters are the unsung heroes of your home's exterior defense. Beyond simple debris removal, our brightening service restores the original curb appeal of your gutter faces, removing unsightly 'tiger stripes' and oxidation for a polished, like-new finish.",
    includes: [],
    price: null,
  },
  {
    /**
     * NEW PAGE, closing a real gap. Roof cleaning is offered in both of the live
     * site's quote forms and promised in its hero, but has no section on the
     * services page — the site advertises a service it never sells.
     *
     * The copy below is portfolio entry 05, verbatim. It is the only roof copy
     * that exists. It is thinner than the other three and should be replaced
     * with something Tristen writes.
     */
    slug: "roof-cleaning",
    name: "Roof Cleaning",
    sourceName: "Roof Cleaning Services (portfolio entry 05)",
    cta: "Get Quote",
    intro:
      "Expertly cleaned residential and commercial roofs, removing moss, algae, and dark stains. This service emphasizes extending roof lifespan and preventing damage through specialized, low-pressure cleaning methods, restoring the roof's aesthetic and functional integrity.",
    includes: [],
    price: null,
    thin: "Copy is portfolio entry 05, the only roof copy on the live site. Needs Tristen's own words.",
  },
];

/** The live site's six numbered portfolio entries, verbatim. */
export const portfolio = [
  { n: "01", title: "Residential House Washing", body: "Revitalized home exteriors using advanced soft wash techniques. This project showcases the transformation of residential properties, removing dirt, grime, and mold to enhance curb appeal and protect surfaces. Focuses on safe and effective cleaning for various siding types." },
  { n: "02", title: "Concrete & Paver Restoration", body: "Restored driveways, patios, and walkways using high-pressure washing and detailed cleaning. Project scope includes removing oil stains, dirt, and weeds, followed by sealing pavers to enhance durability and appearance for a like-new finish." },
  { n: "03", title: "Gutter & Window Cleaning", body: "Meticulously cleaned gutters to prevent water damage and washed windows for crystal-clear views. This service ensures proper water management and enhances natural light, contributing to both property maintenance and occupant comfort." },
  { n: "04", title: "Commercial Property Cleaning", body: "Provided comprehensive exterior cleaning for commercial establishments, including storefronts and office buildings. Project highlights include debris removal, power washing of facades, and maintaining a pristine appearance to attract customers and ensure a welcoming environment." },
  { n: "05", title: "Roof Cleaning Services", body: "Expertly cleaned residential and commercial roofs, removing moss, algae, and dark stains. This service emphasizes extending roof lifespan and preventing damage through specialized, low-pressure cleaning methods, restoring the roof's aesthetic and functional integrity." },
  { n: "06", title: "Before & After Gallery Showcase", body: "A curated collection of before and after images demonstrating the dramatic impact of professional exterior cleaning. This gallery highlights the effectiveness of our power washing, soft washing, and specialized cleaning services across diverse property types." },
] as const;

export const quoteForm = {
  serviceOptions: services.map((s) => s.name),
  fields: {
    name: "Full name",
    email: "Email",
    phone: "Phone number",
    address: "Property address or town",
    service: "Service type",
    message: "Message",
    photos: "Photos of the area",
  },
  /** The upload is the highest-value field: it lets Tristen quote without a site visit. */
  photosHint: "Optional, and the fastest way to a real number — a photo usually means we can quote without visiting.",
  messagePlaceholder: "Tell us more about your project, property size, or any specific requirements...",
  submit: "Request my free quote",
} as const;

/**
 * Connective copy.
 *
 * ⚠️ LANGUAGE, NEVER CLAIMS. Everything in this block is a label, a kicker or a
 * transition — words that carry the composition. Not one of them asserts a
 * fact: no counts, no timings, no guarantees, no prices, no testimonials, no
 * years in business. Every factual string on this site is still verbatim from
 * the live Wix capture and lives above, in `business`, `services` and `home`.
 *
 * The test before adding a line here: could Tristen be held to it? If yes, it
 * does not belong in this block.
 */
export const connective = {
  hero: {
    /** Sits on the dirty side of the split. */
    before: "Before",
    /** Sits on the washed side. */
    after: "After",
    lane: "The clean line",
  },
  sections: {
    services: { kicker: "What we clean", lead: "Four surfaces, one crew, one visit." },
    proof: { kicker: "Where and what", lead: "Oakland County, and the four things we do in it." },
    difference: { kicker: "The difference", lead: "The whole argument is the line between the two halves." },
    method: { kicker: "How it works", lead: "Photograph it, price it, clean it." },
    about: { kicker: "Who turns up", lead: "One crew, and the same one every time." },
    area: { kicker: "Where we work", lead: "If you are in the county, you are in the area." },
    quote: { kicker: "Ready when you are", lead: "Send a photo. Get a real number." },
  },
  /** Marginalia — set small on the angle, running down the side of a section. */
  margin: {
    services: "Surfaces",
    difference: "The line",
    method: "The order of it",
    quote: "Start here",
  },
} as const;
