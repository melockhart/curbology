import { handle, rpc } from "../../../../lib/admin-route";

/** Only these keys can be written. The form is not the allowlist — a POST can
 *  carry any field name, and an open upsert would let one write arbitrary rows. */
const KEYS = new Set([
  "home.heroHeading", "home.heroBody",
  "business.hours", "business.serviceTowns",
  "pricing.note",
]);

export async function POST(request: Request) {
  return handle(request, "/admin/content", async (form, session) => {
    const patch: Record<string, string> = {};
    for (const [key, raw] of form.entries()) {
      if (KEYS.has(key)) patch[key] = String(raw);
    }
    if (Object.keys(patch).length === 0) throw new Error("Nothing to save");
    // One call, so a half-saved form is not a state the site can be left in.
    await rpc("content_upsert", { _patch: patch }, session);
  });
}
