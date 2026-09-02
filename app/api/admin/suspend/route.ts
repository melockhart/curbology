import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/users", async (form, session) => {
    const userId = String(form.get("user_id") ?? "");
    if (!userId) throw new Error("Missing user");
    await rpc("admin_suspend_user", {
      _user_id: userId, _suspended: form.get("suspended") === "yes",
    }, session);
  });
}
