import { configured } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { supabase } from "../../../../lib/service-db";
import { corsPreflight, jsonResponse, randomId, TOKEN_PREFIX } from "../../../../lib/mcp/oauth";

/**
 * RFC 7591 — dynamic client registration.
 *
 * This is the step that was failing: Claude registers itself before it can ask
 * for anything, and there was nothing here to register with.
 *
 * Registration is deliberately open, as the spec intends for public clients.
 * It grants nothing on its own — a registered client still has to send a human
 * through the consent page, and that human still has to be signed in and on the
 * allowlist before any token exists.
 */
export async function POST(request: Request) {
  if (previewMode() || !configured()) {
    return jsonResponse({ error: "temporarily_unavailable", error_description: "This deployment has no database, so it cannot register clients." }, 503);
  }
  let body: { client_name?: string; redirect_uris?: string[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    /* An empty registration is legal — defaults below cover it. */
  }

  const redirectUris = Array.isArray(body.redirect_uris) ? body.redirect_uris.map(String) : [];

  /* At least one redirect URI, and every one of them absolute https (or
     localhost, which is how desktop clients loop back).

     Registering with none used to be allowed, and downstream the allowlist
     check was skipped when the list was empty — so a client could register
     with no URIs and then have a code delivered anywhere. Since registration
     is open, that was an authorization-code interception waiting to happen:
     anyone could register, send a consent link naming their own redirect, and
     collect the code if a human approved. An empty allowlist is not "anything
     goes"; it is an invalid registration. */
  if (redirectUris.length === 0) {
    return jsonResponse(
      { error: "invalid_redirect_uri", error_description: "At least one redirect_uri is required." },
      400,
    );
  }
  const bad = redirectUris.find((uri) => {
    try {
      const parsed = new URL(uri);
      const loopback = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "[::1]";
      return !(parsed.protocol === "https:" || (parsed.protocol === "http:" && loopback));
    } catch {
      return true;
    }
  });
  if (bad) {
    return jsonResponse(
      { error: "invalid_redirect_uri", error_description: `redirect_uri must be absolute https (or http on loopback): ${bad}` },
      400,
    );
  }

  const clientId = randomId(`${TOKEN_PREFIX}client_`);
  const clientName = body.client_name ?? "MCP client";

  const response = await supabase("/rest/v1/oauth_clients", {
    method: "POST",
    body: JSON.stringify({
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
    }),
  });
  if (!response.ok) {
    return jsonResponse({ error: "server_error", error_description: (await response.text()).slice(0, 200) }, 500);
  }

  return jsonResponse(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    201,
  );
}

export async function OPTIONS() {
  return corsPreflight();
}
