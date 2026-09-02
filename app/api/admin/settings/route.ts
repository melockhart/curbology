import { handle, rpc } from "../../../../lib/admin-route";

/** Typed, because a setting is read by code that expects a shape. Checkboxes
 *  are listed explicitly: an unticked box sends nothing at all, so a loop over
 *  the form entries alone can never turn one off. */
const TEXT = new Set(["site.banner", "reviews.googleUrl"]);
const FLAGS = ["portal.reviewOpen", "portal.testimonialOpen"];

export async function POST(request: Request) {
  return handle(request, "/admin/settings", async (form, session) => {
    const patch: Record<string, string | boolean> = {};
    for (const [key, raw] of form.entries()) {
      if (TEXT.has(key)) patch[key] = String(raw).trim();
    }
    for (const flag of FLAGS) patch[flag] = form.get(flag) === "yes";
    await rpc("setting_upsert", { _patch: patch }, session);
  });
}
