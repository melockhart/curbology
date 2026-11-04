/**
 * Editable site copy, with no I/O: which keys exist, and laying saved values
 * over the defaults in lib/content.ts. A key is the path to a string, such as
 * "home.heroHeading" or "services.0.intro".
 */
import { business, connective, home, nav, portfolio, quoteForm, services } from "../content";
import { pages } from "../page-copy";

export const DEFAULTS = { business, nav, home, services, portfolio, quoteForm, connective, pages };
export type SiteContent = typeof DEFAULTS;

/** Identifiers and records of where copy came from. Changing these breaks links or facts about the capture. */
const LOCKED_FIELDS = new Set(["slug", "href", "sourceName", "thin", "n", "serviceOptions", "tone"]);
/** Empty today and waiting on Tristen, so they have no string yet but may be given one. */
const FILLABLE = new Set(["business.email", "business.hours", "business.postalAddress"]);

export type CopyEntry = { key: string; value: string | null };

export function listCopy(): CopyEntry[] {
  const out: CopyEntry[] = [];
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") {
      out.push({ key: path, value });
    } else if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${path}.${index}`));
    } else if (value && typeof value === "object") {
      for (const [field, entry] of Object.entries(value)) {
        if (!LOCKED_FIELDS.has(field)) walk(entry, path ? `${path}.${field}` : field);
      }
    } else if (value === null && FILLABLE.has(path)) {
      out.push({ key: path, value: null });
    }
  };
  walk(DEFAULTS, "");
  return out;
}

const KNOWN = new Set(listCopy().map((entry) => entry.key));
export const isCopyKey = (key: string) => KNOWN.has(key);

/**
 * Places a picture can go. Every one of them renders an honest "waiting for a
 * photo" panel until an image is set, so a slot can never show a broken picture.
 */
export const IMAGE_SLOTS: Record<string, string> = {
  "brand.logo": "The logo, in every header and portal",
  ...Object.fromEntries(portfolio.map((item, index) => [`gallery.${index}`, `Gallery: ${item.title}`])),
  ...Object.fromEntries(services.map((service) => [`service.${service.slug}`, `Service page: ${service.name}`])),
};
export const isImageSlot = (slot: string) => Object.hasOwn(IMAGE_SLOTS, slot);

export type SiteImage = { url: string; alt: string };
export type Overrides = Record<string, unknown>;

/** A copy of the defaults with saved values laid over. Unknown keys are ignored, so a stale row cannot break a page. */
export function applyOverrides(overrides: Overrides): SiteContent & { images: Record<string, SiteImage> } {
  const merged = structuredClone(DEFAULTS) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(overrides)) {
    if (!isCopyKey(key) || typeof value !== "string") continue;
    const path = key.split(".");
    const last = path.pop()!;
    let at = merged as Record<string, unknown>;
    for (const part of path) at = at[part] as Record<string, unknown>;
    at[last] = value;
  }
  const content = merged as unknown as SiteContent;
  (content.quoteForm as { serviceOptions: unknown }).serviceOptions = content.services.map((s) => s.name);

  const images: Record<string, SiteImage> = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (!key.startsWith("image.") || !isImageSlot(key.slice(6))) continue;
    const image = value as Partial<SiteImage> | null;
    if (image && typeof image.url === "string") images[key.slice(6)] = { url: image.url, alt: String(image.alt ?? "") };
  }
  return { ...content, images };
}
