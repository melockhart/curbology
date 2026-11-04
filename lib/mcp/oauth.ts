import { supabase } from "../service-db";

/**
 * OAuth 2.1 provider for the MCP server.
 *
 * Claude Desktop and claude.ai cannot be handed a static bearer token for a
 * remote MCP server. The connector discovers the authorization server, registers
 * itself dynamically, and runs an authorization-code + PKCE flow. Without those
 * endpoints it fails at the first step — "Couldn't register with Design
 * Library's sign-in service" — which is what was happening.
 *
 * The issued access token is an `{TABLE_PREFIX}api_tokens` row, so the same
 * bearer check the API already performs validates it unchanged.
 *
 * WebCrypto throughout, not `node:crypto`: this runs in a Worker.
 */

export const SCOPES = ["read", "write"] as const;
export const TOKEN_PREFIX = "cb_"; // short app slug + "_", e.g. "dl_"

/**
 * The origin to advertise.
 *
 * Taken from the request rather than an env var, because preview and production
 * are the same code and an issuer that disagrees with the host the client
 * actually reached fails validation. Everything discovery returns has to be
 * self-consistent with how the client got here.
 */
export function originOf(request: Request): string {
  // The request's own URL, never X-Forwarded-Host. A client can set that header
  // to anything, and the screenshot tool opens whatever this returns.
  return new URL(request.url).origin;
}

export async function sha256hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** PKCE S256: base64url(sha256(verifier)) must equal the challenge. */
export async function verifyPkceS256(verifier: string, challenge: string): Promise<boolean> {
  if (!verifier || !challenge) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64 === challenge;
}

export function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `${prefix}${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * What a request that names no scope this server understands receives.
 *
 * Deliberately a separate literal from `SCOPES`, not derived from it. If a
 * privileged scope is ever added to `SCOPES`, the baseline must not silently
 * start including it — that is the one way the "unrecognised scope falls back
 * to everything" concern could become real, and this is what forecloses it.
 * Widening the baseline has to be a deliberate edit to this line.
 */
export const BASELINE_GRANT: string[] = ["read", "write"];

/**
 * Resolve requested scopes.
 *
 * Unrecognised scope names are **ignored, not fatal**. RFC 6749 §3.3 says the
 * authorization server may ignore the requested scope and issue its own, and
 * clients do send names that mean something to them and nothing here — Claude
 * asks for its own scope string. Rejecting those outright killed the connection
 * at the authorize step with `invalid_scope`, which is the opposite of the
 * one-click connect this exists for.
 *
 * An automated review asked for the opposite — reject an all-unrecognised
 * request with `invalid_scope`. That is textbook, and it is exactly the change
 * that broke the connect button, so it is not what this does. The escalation it
 * guards against cannot occur here: the fallback is the baseline a no-scope
 * request already receives, nothing above read and write exists to escalate to,
 * and both are granted together at consent regardless. The real control is the
 * consent screen, which says in words what is being handed over before anyone
 * presses Allow.
 *
 * The forward-looking half of that concern is real and is handled by
 * `BASELINE_GRANT` being its own literal: adding a privileged scope to `SCOPES`
 * later cannot widen this fallback.
 */
export function normalizeScopes(scope?: string | null): string[] {
  if (!scope || !scope.trim()) return [...BASELINE_GRANT];
  const asked = scope.split(/[\s,]+/).filter(Boolean);
  /* Intersect with what this server supports, then bound by the baseline. Two
     steps rather than one so a supported-but-privileged scope could never be
     obtained by a client simply listing it. */
  const recognised = asked.filter((value) => (SCOPES as readonly string[]).includes(value)).filter((value) => BASELINE_GRANT.includes(value));
  return recognised.length ? recognised : [...BASELINE_GRANT];
}

export function authServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [...SCOPES],
  };
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [...SCOPES],
    bearer_methods_supported: ["header"],
  };
}

/* Discovery and the token endpoint are called cross-origin by the connector,
   so they have to answer preflight. */
export const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-protocol-version, mcp-session-id",
  "Access-Control-Expose-Headers": "mcp-session-id, WWW-Authenticate",
  "Access-Control-Max-Age": "86400",
};

export const jsonResponse = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS, ...extra } });

export const corsPreflight = () => new Response(null, { status: 204, headers: CORS });

/** Mint an access token for an owner. The raw value is returned once and never stored. */
export async function mintToken(ownerId: string, ownerEmail: string, scopes: string[], clientId: string | null, name: string) {
  const raw = randomId(TOKEN_PREFIX);
  const response = await supabase("/rest/v1/api_tokens", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      owner_id: ownerId,
      owner_email: ownerEmail,
      name,
      token_hash: await sha256hex(raw),
      token_prefix: raw.slice(0, 12),
      scopes,
      client_id: clientId,
    }),
  });
  if (!response.ok) return { error: (await response.text()).slice(0, 200) };
  return { token: raw };
}
