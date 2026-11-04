/**
 * A same-site path to go to after signing in, or the fallback. An absolute URL
 * here would be an open redirect, and browsers read "//" and "/\" as other sites.
 */
export function safePath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.includes("\\") || /[\r\n\t]/.test(value)) return fallback;
  return value;
}
