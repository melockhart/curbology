import { cookies } from "next/headers";
import { runtimeEnv, allowedEmails, ownerEmails } from "./env";

/**
 * The console holds customers' names, addresses, phone numbers and photographs
 * of their homes. It is not "a dashboard behind a hard-to-guess URL".
 *
 * Sign-in is the Supabase password grant; the access token rides in an HttpOnly
 * cookie and is re-verified against GoTrue on every request. Having a valid
 * Supabase account is not by itself permission to be here — the address must
 * also be on the allowlist, which is checked separately and again on every read.
 *
 * Ported from the Opscend Design Library rather than written again.
 */
export const SESSION_COOKIE = "curbology_session";

export async function signIn(email: string, password: string) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return { error: "The console is not configured yet." };

  const allowed = allowedEmails();
  if (allowed.size === 0) return { error: "No administrator addresses are configured." };
  if (!allowed.has(email.trim().toLowerCase())) {
    // Deliberately the same message as a wrong password: whether an address is
    // on the allowlist is not something to confirm to someone who is not on it.
    return { error: "Wrong email or password." };
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_SECRET_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) return { error: "Wrong email or password." };

  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) return { error: "Sign-in failed." };
  return { token: payload.access_token, expiresIn: payload.expires_in ?? 3600 };
}

/**
 * The signed-in person, or null. Verified against GoTrue — never trusted from
 * the cookie alone, which is only a bearer of someone else's claim.
 *
 * The token comes back with them because the RPC contract needs it: writes are
 * made as the person, so the database can re-check who they are rather than
 * take this process's word for it.
 */
export type Session = {
  email: string;
  id: string;
  token: string;
  /** Sees `godModeOnly` screens and can claim the first admin role. */
  isGodMode: boolean;
};

export async function currentSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { email?: string; id?: string };
    const email = user.email?.toLowerCase();
    if (!email || !user.id || !allowedEmails().has(email)) return null;
    return { email, id: user.id, token, isGodMode: ownerEmails().has(email) };
  } catch {
    return null;
  }
}

/** The address only, for the many callers that need nothing else. */
export async function currentUser(): Promise<string | null> {
  return (await currentSession())?.email ?? null;
}
