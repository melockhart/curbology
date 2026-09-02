import type { Metadata } from "next";
import { seoFor } from "./db";

/**
 * Per-page title and description, overridable from the console.
 *
 * The override merges over what the page declares rather than replacing it, so
 * an override that sets only a title leaves the description the code wrote.
 * That is why the console's fields may be left blank: blank means "keep what
 * the page says", which is almost always the right default and is impossible to
 * express if an override is all-or-nothing.
 *
 * If there is no database, or the lookup fails, the page keeps its own metadata
 * — a title is not worth a 500.
 */
export async function pageMetadata(path: string, base: Metadata): Promise<Metadata> {
  const override = await seoFor(path);
  if (!override) return base;
  return {
    ...base,
    ...(override.title ? { title: override.title } : {}),
    ...(override.description ? { description: override.description } : {}),
    ...(override.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
