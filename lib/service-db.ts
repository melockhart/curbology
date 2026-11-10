import { runtimeEnv } from "./env";
import { prefixed } from "./table-prefix";

/**
 * For reads a public page can do without: when the database stops answering, a
 * page would wait out each read in turn. After one timeout these reads fail at
 * once for a short spell, and the page shows its default copy. Writes, sign-in
 * and MCP calls do not go through this, so a slow moment never blocks them.
 */
let downUntil = 0;
export async function guarded(call: () => Promise<Response>): Promise<Response> {
  if (Date.now() < downUntil) throw new Error("Database unavailable");
  try {
    return await call();
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) downUntil = Date.now() + 15_000;
    throw error;
  }
}

/** Server-only access with the secret key. Never reachable from a browser. */
export function supabase(path: string, init: RequestInit = {}) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("Supabase is not configured");
  const target = path.startsWith("/rest/v1/") ? `/rest/v1/${prefixed(path.slice(9))}` : path;
  return fetch(`${SUPABASE_URL}${target}`, {
    // Long enough for a busy shared database, short enough that nothing hangs.
    signal: init.signal ?? AbortSignal.timeout(12000),
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

/**
 * Calls a console RPC on behalf of a signed-in owner reached through an MCP
 * token. The database accepts the secret key as an admin, and logs the address
 * in this header as who did it.
 */
export async function serviceRpc<T = unknown>(name: string, args: Record<string, unknown>, actorEmail: string): Promise<T> {
  const response = await supabase(`/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "x-curbology-actor": actorEmail },
    body: JSON.stringify(args),
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? text;
    } catch {
      // Not JSON, so the raw text is the best available.
    }
    throw new Error(message.slice(0, 300));
  }
  return (text ? JSON.parse(text) : null) as T;
}
