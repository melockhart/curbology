import { handle, rpc } from "../../../../lib/admin-route";

export async function POST(request: Request) {
  return handle(request, "/admin/team-access", async (form, session) => {
    const userId = String(form.get("user_id") ?? "");
    const role = String(form.get("role") ?? "");
    if (!userId || (role !== "admin" && role !== "client")) throw new Error("Unknown role");
    // Whether the last administrator may revoke their own role is decided in the
    // database, where the count is authoritative.
    await rpc("admin_set_user_role", {
      _user_id: userId, _role: role, _granted: form.get("granted") === "yes",
    }, session);
  });
}
