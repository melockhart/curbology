import { supabase } from "../../../../lib/service-db";
import { corsPreflight, jsonResponse, mintToken, normalizeScopes, randomId, sha256hex, TOKEN_PREFIX, verifyPkceS256 } from "../../../../lib/mcp/oauth";

/** Authorization code + PKCE in, access token out. Reads JSON or form-encoded, because clients differ. */
type Params = Record<string, string>;
const YEAR = 31_536_000;

async function readParams(request: Request): Promise<Params> {
  if ((request.headers.get("content-type") ?? "").includes("application/json")) {
    return (await request.json().catch(() => ({}))) as Params;
  }
  return Object.fromEntries(new URLSearchParams(await request.text())) as Params;
}

export async function POST(request: Request) {
  const params = await readParams(request);
  const grant = String(params.grant_type ?? "");

  if (grant === "refresh_token") {
    const hash = await sha256hex(String(params.refresh_token ?? ""));
    const response = await supabase(`/rest/v1/oauth_refresh_tokens?token_hash=eq.${hash}&revoked_at=is.null&select=owner_id,owner_email,client_id,scopes&limit=1`);
    const [row] = response.ok ? ((await response.json()) as { owner_id: string; owner_email: string; client_id: string; scopes: string[] }[]) : [];
    if (!row) return jsonResponse({ error: "invalid_grant" }, 400);
    const minted = await mintToken(row.owner_id, row.owner_email, row.scopes, row.client_id, "Refreshed by an MCP client");
    if (!minted.token) return jsonResponse({ error: "server_error" }, 500);
    return jsonResponse({ access_token: minted.token, token_type: "Bearer", expires_in: YEAR, scope: row.scopes.join(" ") });
  }

  if (grant !== "authorization_code") return jsonResponse({ error: "unsupported_grant_type" }, 400);

  const hash = await sha256hex(String(params.code ?? ""));
  const found = await supabase(`/rest/v1/oauth_codes?code_hash=eq.${hash}&select=*&limit=1`);
  const [row] = found.ok
    ? ((await found.json()) as { client_id: string; redirect_uri: string; code_challenge: string; scope: string; owner_id: string; owner_email: string; used: boolean; expires_at: string }[])
    : [];
  if (!row) return jsonResponse({ error: "invalid_grant", error_description: "Unknown code." }, 400);
  if (row.used) return jsonResponse({ error: "invalid_grant", error_description: "Code already used." }, 400);
  if (new Date(row.expires_at).getTime() < Date.now()) return jsonResponse({ error: "invalid_grant", error_description: "Code expired." }, 400);
  if (params.client_id && params.client_id !== row.client_id) return jsonResponse({ error: "invalid_grant", error_description: "Client mismatch." }, 400);
  if (params.redirect_uri && params.redirect_uri !== row.redirect_uri) return jsonResponse({ error: "invalid_grant", error_description: "redirect_uri mismatch." }, 400);
  if (!(await verifyPkceS256(String(params.code_verifier ?? ""), row.code_challenge))) {
    return jsonResponse({ error: "invalid_grant", error_description: "PKCE verification failed." }, 400);
  }

  // The filter makes this the single-use check: of two racing requests, one row comes back to only one.
  const claim = await supabase(`/rest/v1/oauth_codes?code_hash=eq.${hash}&used=eq.false`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ used: true }),
  });
  const claimed = claim.ok ? ((await claim.json()) as unknown[]) : [];
  if (claimed.length !== 1) return jsonResponse({ error: "invalid_grant", error_description: "Code already used." }, 400);

  const scopes = normalizeScopes(row.scope);
  const minted = await mintToken(row.owner_id, row.owner_email, scopes, row.client_id, "Issued to an MCP client");
  if (!minted.token) return jsonResponse({ error: "server_error" }, 500);

  const refresh = randomId(`${TOKEN_PREFIX}refresh_`);
  const stored = await supabase("/rest/v1/oauth_refresh_tokens", {
    method: "POST",
    body: JSON.stringify({ token_hash: await sha256hex(refresh), owner_id: row.owner_id, owner_email: row.owner_email, client_id: row.client_id, scopes }),
  });
  return jsonResponse({
    access_token: minted.token,
    token_type: "Bearer",
    expires_in: YEAR,
    ...(stored.ok ? { refresh_token: refresh } : {}),
    scope: scopes.join(" "),
  });
}

export async function OPTIONS() {
  return corsPreflight();
}
