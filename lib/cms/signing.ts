/** Signed draft previews, so a draft can be viewed by link without a sign-in and cannot be guessed. */
export const DRAFT_COOKIE = "curbology_draft";

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signDraft(id: string, expiresAt: number, secret: string): Promise<string> {
  return `${id}.${expiresAt}.${await hmac(`${id}.${expiresAt}`, secret)}`;
}

/** The draft id when the value is genuine and unexpired, otherwise null. */
export async function verifyDraftCookie(raw: string, secret: string, now: number): Promise<string | null> {
  const [id, expires, signature] = raw.split(".");
  if (!id || !expires || !signature || !/^[0-9a-f-]{36}$/.test(id)) return null;
  if (!(Number(expires) > now)) return null;
  const expected = await hmac(`${id}.${expires}`, secret);
  if (expected.length !== signature.length) return null;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0 ? id : null;
}
