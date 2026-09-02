import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/seo", async (form, session) => {
    if (form.get("remove") === "yes") {
      await rpc("redirect_delete", { _id: String(form.get("id") ?? "") }, session);
      return;
    }
    const from = String(form.get("from") ?? "").trim();
    const to = String(form.get("to") ?? "").trim();
    if (!from.startsWith("/")) throw new Error("The from-path has to start with /");
    if (!to) throw new Error("A redirect needs somewhere to go");
    // The loop check lives in the function, not here: it has to hold for every
    // caller, and this route is only one of them.
    await rpc("redirect_upsert", { _from: from, _to: to, _permanent: form.get("permanent") === "yes" }, session);
  });
}
