import { adminOnly, backWith } from "../../../../lib/admin-action";
import { supabase, serviceRpc } from "../../../../lib/service-db";

/**
 * Ends a connection. Refresh tokens go with it, or the client would just mint
 * itself another access token on its next call.
 */
export async function POST(request: Request) {
  const session = await adminOnly();
  if (session instanceof Response) return session;

  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response("Bad origin", { status: 403 });

  const form = await request.formData();
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return backWith(request, "/connections", "error");

  try {
    const now = JSON.stringify({ revoked_at: new Date().toISOString() });
    const revoked = await supabase(`/rest/v1/api_tokens?id=eq.${id}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: now });
    if (!revoked.ok) throw new Error("revoke failed");
    const [row] = (await revoked.json()) as { client_id: string | null }[];
    if (row?.client_id) {
      const client = encodeURIComponent(row.client_id);
      const results = await Promise.all([
        supabase(`/rest/v1/api_tokens?client_id=eq.${client}&revoked_at=is.null`, { method: "PATCH", body: now }),
        supabase(`/rest/v1/oauth_refresh_tokens?client_id=eq.${client}&revoked_at=is.null`, { method: "PATCH", body: now }),
      ]);
      if (results.some((result) => !result.ok)) throw new Error("revoke failed");
    }
    await serviceRpc("log_activity", { _entity: "connection", _entity_id: id, _verb: "revoke", _detail: {} }, session.email);
  } catch {
    return backWith(request, "/connections", "error");
  }
  return backWith(request, "/connections", "saved");
}
