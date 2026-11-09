import { runtimeEnv } from "./env";
import { prefixed } from "./table-prefix";

/**
 * When the database stops answering, every page would wait out each read in turn.
 * After one timeout, calls fail at once for a short spell, so pages fall back to
 * their defaults straight away and the database is tried again shortly after.
 */
let downUntil = 0;
export async function guarded(call: () => Promise<Response>): Promise<Response> {
  if (Date.now() < downUntil) throw new Error("Database unavailable");
  try {
    return await call();
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) downUntil = Date.now() + 30_000;
    throw error;
  }
}

/** Server-only access with the secret key. Never reachable from a browser. */
export function supabase(path: string, init: RequestInit = {}) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("Supabase is not configured");
  const target = path.startsWith("/rest/v1/") ? `/rest/v1/${prefixed(path.slice(9))}` : path;
  return guarded(() => fetch(`${SUPABASE_URL}${target}`, {
    // A slow database must not hang a page. Callers treat a timeout like any failed read.
    signal: init.signal ?? AbortSignal.timeout(4000),
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  }));
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
