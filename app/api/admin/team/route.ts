import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/team", async (form, session) => {
    const id = String(form.get("id") ?? "").trim();

    if (form.get("remove") === "yes") {
      if (!id) throw new Error("Nothing to remove");
      await rpc("team_delete", { _id: id }, session);
      return;
    }

    const name = String(form.get("name") ?? "").trim();
    if (!name) throw new Error("A name is the one field that cannot be empty");

    await rpc("team_upsert", {
      _patch: {
        ...(id ? { id } : {}),
        name,
        role_title: String(form.get("role_title") ?? "").trim(),
        bio: String(form.get("bio") ?? "").trim(),
        photo_url: String(form.get("photo_url") ?? "").trim(),
        is_published: form.get("is_published") === "yes",
      },
    }, session);
  });
}
