import { supabase } from "../../../../lib/service-db";
import { currentSession } from "../../../../lib/session";
import { jsonResponse, normalizeScopes, randomId, sha256hex, TOKEN_PREFIX } from "../../../../lib/mcp/oauth";

/**
 * Issues the authorization code. Session-authed, not bearer-authed: the point of
 * the consent screen is that a signed-in admin approved this. A code issued any
 * other way would let a client mint itself access.
 */
export async function POST(request: Request) {
  const user = await currentSession();
  if (!user) return jsonResponse({ error: "not_signed_in" }, 401);

  // A cross-site page must not be able to approve a client using this cookie.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return jsonResponse({ error: "bad_origin" }, 403);

  let body: { clientId?: string; redirectUri?: string; challenge?: string; scope?: string; resource?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }
  const clientId = String(body.clientId ?? "");
  const redirectUri = String(body.redirectUri ?? "");
  const challenge = String(body.challenge ?? "");
  if (!clientId || !redirectUri || !challenge) return jsonResponse({ error: "invalid_request" }, 400);

  const lookup = await supabase(`/rest/v1/oauth_clients?client_id=eq.${encodeURIComponent(clientId)}&select=redirect_uris&limit=1`);
  const [client] = lookup.ok ? ((await lookup.json()) as { redirect_uris: string[] }[]) : [];
  if (!client) return jsonResponse({ error: "unknown_client" }, 400);
  // Unconditional and exact. An empty list is a refusal, never a wildcard.
  if (!client.redirect_uris?.includes(redirectUri)) return jsonResponse({ error: "redirect_uri_not_registered" }, 400);

  const code = randomId(`${TOKEN_PREFIX}code_`);
  const stored = await supabase("/rest/v1/oauth_codes", {
    method: "POST",
    body: JSON.stringify({
      code_hash: await sha256hex(code),
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge: challenge,
      scope: normalizeScopes(body.scope).join(" "),
      owner_id: user.id,
      owner_email: user.email,
      resource: body.resource || null,
      // Long enough for a redirect, short enough that a code left in a URL is worthless.
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  });
  if (!stored.ok) return jsonResponse({ error: "server_error" }, 500);
  return jsonResponse({ code });
}
