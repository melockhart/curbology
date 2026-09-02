import { redirect, permanentRedirect, notFound } from "next/navigation";
import { findRedirect, countRedirectHit } from "../../lib/db";

/**
 * The last route Next tries, and the only reason it exists: to check the
 * redirects table before rendering a 404.
 *
 * A catch-all rather than middleware. Every real route — static, dynamic and
 * every API handler — is matched first, so this only ever sees paths that
 * would otherwise have been a 404 anyway. Middleware would run on every
 * request to the site instead, to serve a table that is usually empty.
 *
 * The lookup is exact and the query string is dropped from the match but kept
 * on the destination, because "/old-page?utm_source=…" and "/old-page" are the
 * same page to the person who typed it and different rows to a database.
 */
export const dynamic = "force-dynamic";

export default async function CatchAll({
  params,
}: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const from = `/${(path ?? []).join("/")}`;

  const rule = await findRedirect(from);
  if (!rule) notFound();

  await countRedirectHit(from);
  // Two different functions, not a flag: 308 tells a browser and a search engine
  // to stop asking, and getting that wrong on a temporary move is expensive to
  // undo because the browser has already cached it.
  if (rule.permanent) permanentRedirect(rule.to_path);
  redirect(rule.to_path);
}
