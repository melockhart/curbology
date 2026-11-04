import { runtimeEnv } from "../env";
import { supabase } from "../service-db";
import { QUOTE_PHOTO_BUCKET } from "../table-prefix";
import { DRAFT_RATE_CARD, type RateCard } from "./pricing.ts";
import { MAX_PHOTOS, readGeocoderReply, type AreaCheck, type PhotoType, type QuoteRow } from "./rules.ts";

/**
 * Everything the quote routes do to the outside world: the database, photo
 * storage and the address lookup. All of it runs with the secret key, on the
 * server, because no customer has an account.
 */

const BUCKET = QUOTE_PHOTO_BUCKET;

function json(path: string, method: string, body: unknown, prefer = "return=representation") {
  return supabase(`/rest/v1/${path}`, {
    method,
    headers: { "Content-Type": "application/json", Prefer: prefer },
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ hashing */

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function newToken(): string {
  return [...crypto.getRandomValues(new Uint8Array(32))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The salt means a stored hash cannot be turned back into an IP by trying them all. */
export function hashIp(ip: string): Promise<string> {
  return sha256(`${runtimeEnv().QUOTE_HASH_SALT ?? ""}:${ip}`);
}

/* ---------------------------------------------------------------- the limits */

async function countSince(filter: string, since: Date): Promise<number> {
  const response = await supabase(
    `/rest/v1/quotes?select=id&${filter}&created_at=gte.${encodeURIComponent(since.toISOString())}&limit=1`,
    { headers: { Prefer: "count=exact" } },
  );
  if (!response.ok) throw new Error(`quote count failed: ${response.status}`);
  const total = Number(response.headers.get("content-range")?.split("/")[1]);
  if (!Number.isFinite(total)) throw new Error("quote count was unreadable");
  return total;
}

/** Quotes one address may start in an hour. */
const STARTS_PER_HOUR = 5;
/** Photo reads across the whole site in a day. Past this, quotes go to the owner unread. */
const READS_PER_DAY = 200;

export async function underStartLimit(ipHash: string): Promise<boolean> {
  return (await countSince(`ip_hash=eq.${ipHash}`, new Date(Date.now() - 3_600_000))) < STARTS_PER_HOUR;
}

export async function underReadLimit(): Promise<boolean> {
  return (await countSince("submitted_at=not.is.null", new Date(Date.now() - 86_400_000))) < READS_PER_DAY;
}

/* ------------------------------------------------------------------ address */

/**
 * The US Census geocoder: free, no key, and it names the county. A failure is
 * "unknown", so an outage sends customers to the owner instead of turning them away.
 */
export async function checkAddress(address: string): Promise<AreaCheck> {
  const url = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
  url.search = new URLSearchParams({
    address,
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    layers: "Counties",
    format: "json",
  }).toString();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return { area: "unknown", matchedAddress: null };
    return readGeocoderReply(await response.json());
  } catch {
    return { area: "unknown", matchedAddress: null };
  }
}

/* ------------------------------------------------------------------- quotes */

export type StoredQuote = QuoteRow & {
  token_hash: string;
  address: string;
  matched_address: string | null;
  area: AreaCheck["area"];
  service: string | null;
};

export async function createQuote(record: {
  token_hash: string;
  ip_hash: string;
  address: string;
  matched_address: string | null;
  area: AreaCheck["area"];
  service: string | null;
}): Promise<StoredQuote> {
  const response = await json("quotes", "POST", record);
  if (!response.ok) throw new Error(`quote insert failed: ${response.status}`);
  return ((await response.json()) as StoredQuote[])[0]!;
}

/** Null when the id is wrong or the token does not match, and the two look alike. */
export async function loadQuote(id: string, token: string): Promise<StoredQuote | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id) || !token) return null;
  const hash = await sha256(token);
  const response = await supabase(`/rest/v1/quotes?id=eq.${id}&token_hash=eq.${hash}&select=*`);
  if (!response.ok) throw new Error(`quote read failed: ${response.status}`);
  return ((await response.json()) as StoredQuote[])[0] ?? null;
}

/**
 * Moves a draft to reading and saves the contact, once. The status filter is
 * what stops a double click, or a script, from paying for a second photo read.
 */
export async function claimForReading(id: string, fields: Record<string, unknown>): Promise<StoredQuote | null> {
  const response = await json(`quotes?id=eq.${id}&status=eq.draft`, "PATCH", {
    ...fields,
    status: "reading",
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!response.ok) throw new Error(`quote claim failed: ${response.status}`);
  return ((await response.json()) as StoredQuote[])[0] ?? null;
}

export async function saveOutcome(id: string, fields: Record<string, unknown>): Promise<StoredQuote> {
  const response = await json(`quotes?id=eq.${id}`, "PATCH", { ...fields, updated_at: new Date().toISOString() });
  if (!response.ok) throw new Error(`quote save failed: ${response.status}`);
  return ((await response.json()) as StoredQuote[])[0]!;
}

/** The lead is what appears in the console's existing Leads screen. */
export async function createLead(record: Record<string, unknown>): Promise<string> {
  const response = await json("leads", "POST", { ...record, status: "new" });
  if (!response.ok) throw new Error(`lead insert failed: ${response.status}`);
  return ((await response.json()) as { id: string }[])[0]!.id;
}

export async function updateLead(id: string, fields: Record<string, unknown>): Promise<void> {
  const response = await json(`leads?id=eq.${id}`, "PATCH", fields, "return=minimal");
  if (!response.ok) throw new Error(`lead update failed: ${response.status}`);
}

/* ------------------------------------------------------------------- photos */

export async function storePhoto(quoteId: string, bytes: Uint8Array, type: PhotoType): Promise<boolean> {
  const path = `${quoteId}/${crypto.randomUUID()}.${type.extension}`;
  const upload = await supabase(`/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { "Content-Type": type.mediaType },
    body: bytes as Uint8Array<ArrayBuffer>,
  });
  if (!upload.ok) throw new Error(`photo upload failed: ${upload.status}`);

  const claim = await json("rpc/quote_add_photo", "POST", { _id: quoteId, _path: path, _max: MAX_PHOTOS });
  if (!claim.ok) throw new Error(`photo claim failed: ${claim.status}`);
  if ((await claim.json()) === true) return true;

  // Over the limit, or already submitted. Do not keep a stored file nothing points at.
  await supabase(`/storage/v1/object/${BUCKET}/${path}`, { method: "DELETE" });
  return false;
}

export async function fetchPhoto(path: string): Promise<Uint8Array | null> {
  const response = await supabase(`/storage/v1/object/${BUCKET}/${path}`);
  if (!response.ok) return null;
  return new Uint8Array(await response.arrayBuffer());
}

/* ---------------------------------------------------------------- the console */

export type ConsoleQuote = StoredQuote & {
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  items: { item: string; quantity: number | null }[];
  photo_read: PhotoReadRow | null;
  submitted_at: string | null;
};
type PhotoReadRow = { error?: string; condition?: string; confidence?: string; stories?: number | null; flags?: string[]; summary?: string };

/** Submitted quotes, newest first. The token hash and IP hash stay in the database. */
export async function listQuotes(): Promise<ConsoleQuote[]> {
  const response = await supabase(
    "/rest/v1/quotes?submitted_at=not.is.null&order=created_at.desc&limit=200" +
      "&select=id,created_at,submitted_at,status,address,matched_address,area,service,photo_paths,name,email,phone,message,items,photo_read,result,price_cents,deposit_cents,owner_note",
  );
  if (!response.ok) return [];
  return (await response.json()) as ConsoleQuote[];
}

/* ---------------------------------------------------------------- rate card */

/** The newest saved card. With none saved, the draft, which can price nothing for a customer. */
export async function currentRateCard(): Promise<{ id: string | null; card: RateCard }> {
  const response = await supabase("/rest/v1/quote_rate_cards?select=id,card,approved_at&order=created_at.desc&limit=1");
  if (!response.ok) throw new Error(`rate card read failed: ${response.status}`);
  const row = ((await response.json()) as { id: string; card: RateCard; approved_at: string | null }[])[0];
  if (!row) return { id: null, card: DRAFT_RATE_CARD };
  return { id: row.id, card: { ...row.card, approvedAt: row.approved_at } };
}
