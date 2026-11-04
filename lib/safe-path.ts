/**
 * A same-site path to go to after signing in, or the fallback. An absolute URL
 * here would be an open redirect, and browsers read "//" and "/\" as other sites.
 */
export function safePath(value: unknown, fallback = "/admin"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  // Browsers strip tabs and newlines from a URL, so "/\t/evil.example" arrives as "//evil.example".
  if (value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  const resolved = new URL(value, "https://same.invalid");
  return resolved.origin === "https://same.invalid" ? value : fallback;
}
