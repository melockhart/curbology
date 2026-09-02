import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/seo", async (form, session) => {
    const path = String(form.get("path") ?? "").trim();
    if (!path.startsWith("/")) throw new Error("A path has to start with /");

    if (form.get("remove") === "yes") {
      await rpc("seo_delete", { _path: path }, session);
      return;
    }
    await rpc("seo_upsert", {
      _path: path,
      _title: String(form.get("title") ?? "").trim(),
      _description: String(form.get("description") ?? "").trim(),
      _noindex: form.get("noindex") === "yes",
    }, session);
  });
}
