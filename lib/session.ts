import { cookies } from "next/headers";
import { runtimeEnv, allowedEmails, ownerEmails } from "./env";
import {
  previewMode, previewPassword, PREVIEW_SESSION_VALUE, PREVIEW_EMAIL, PREVIEW_USER_ID,
} from "./preview";

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
  /*
   * The preview door.
   *
   * It exists because the console has to be walkable before Tristen has an
   * account, and it is safe to exist because previewMode() is false the moment
   * SUPABASE_URL is set — so this branch is unreachable anywhere there is real
   * customer data to reach. Without PREVIEW_PASSWORD there is no door at all;
   * the preview is not meant to be a publicly walkable admin, even of sample
   * rows. The email is not checked, because in preview there is nobody to be.
   */
  if (previewMode()) {
    const expected = previewPassword();
    if (!expected) return { error: "The preview console is not open." };
    if (password !== expected) return { error: "Wrong email or password." };
    return { token: PREVIEW_SESSION_VALUE, expiresIn: 60 * 60 * 8 };
  }

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

  if (previewMode()) {
    if (token !== PREVIEW_SESSION_VALUE || !previewPassword()) return null;
    // God mode on, so the preview shows every screen including the locked one.
    // There is nothing behind it here but which env vars are set.
    return { email: PREVIEW_EMAIL, id: PREVIEW_USER_ID, token, isGodMode: true };
  }

  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      signal: AbortSignal.timeout(6000),
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
