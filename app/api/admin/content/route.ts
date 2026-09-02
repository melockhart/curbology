import { setContentBlock } from "../../../../lib/db";
import { adminOnly, backTo } from "../../../../lib/admin-action";

/** Only these keys can be written. The form is not the allowlist — a POST can
 *  carry any field name, and an open upsert would let one write arbitrary rows. */
const KEYS = new Set([
  "home.heroHeading", "home.heroBody",
  "business.hours", "business.serviceTowns",
  "pricing.note",
]);

export async function POST(request: Request) {
  const auth = await adminOnly();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  for (const [key, raw] of form.entries()) {
    if (!KEYS.has(key)) continue;
    await setContentBlock(key, String(raw), auth.email);
  }
  return backTo(request, "/admin/content");
}
