/**
 * Curbology shares Opscend's Supabase project for now, whose public schema has
 * its own profiles, user_roles and has_role. Every Curbology table and function
 * is named curbology_*, and this one function is where code meets that name.
 * Moving to its own project later means dropping the prefix here and in the SQL.
 */
const PREFIX = "curbology_";

/** "leads?x=1" becomes "curbology_leads?x=1", and "rpc/foo" becomes "rpc/curbology_foo". */
export function prefixed(path: string): string {
  return path.startsWith("rpc/") ? `rpc/${PREFIX}${path.slice(4)}` : `${PREFIX}${path}`;
}

export const QUOTE_PHOTO_BUCKET = "curbology-quote-photos";
export const SITE_MEDIA_BUCKET = "curbology-site-media";
