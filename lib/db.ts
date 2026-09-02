import { runtimeEnv, configured } from "./env";

/**
 * Supabase REST, service-role.
 *
 * This runs server-side only. The service key bypasses RLS, which is exactly why
 * the tables have no anon policies: these functions are the only door, and each
 * public write below sets the columns a submitter must not be able to choose.
 */
async function rest(path: string, init: RequestInit = {}) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error("Supabase is not configured");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Reads return [] when there is no database, so every screen renders its empty
 *  state instead of throwing. A console that white-screens before setup is
 *  harder to set up. */
async function rows<T>(path: string): Promise<T[]> {
  if (!configured()) return [];
  try {
    const response = await rest(path);
    if (!response.ok) return [];
    return (await response.json()) as T[];
  } catch {
    return [];
  }
}

export type Lead = {
  id: string; created_at: string; name: string; email: string; phone: string | null;
  address: string | null; town: string | null; service: string | null; message: string | null;
  photo_paths: string[]; source_page: string | null;
  status: "new" | "contacted" | "quoted" | "won" | "lost" | "spam";
  quoted_amount: number | null; notes: string | null;
};

export type Review = {
  id: string; created_at: string; name: string; email: string; rating: number; body: string;
  service: string | null; consented: boolean; published: boolean; owner_reply: string | null;
  status: "new" | "replied" | "flagged" | "archived";
};

export type Booking = {
  id: string; created_at: string; name: string; email: string; phone: string | null;
  format: "in-person" | "self-record" | "either" | null;
  requested_slots: string | null; confirmed_slot: string | null;
  state: "requested" | "confirmed" | "recorded" | "received" | "published" | "declined" | "no-show";
  video_url: string | null; notes: string | null;
};

export const listLeads = () =>
  rows<Lead>("leads?select=*&order=created_at.asc&status=in.(new,contacted,quoted)");
export const listAllLeads = () => rows<Lead>("leads?select=*&order=created_at.desc");
export const listReviews = () => rows<Review>("reviews?select=*&order=created_at.desc");
export const listBookings = () => rows<Booking>("bookings?select=*&order=created_at.desc");

/** Published reviews, for the public /reviews page. */
export const publishedReviews = () =>
  rows<Review>("reviews?select=*&published=is.true&order=created_at.desc");

export async function insert(table: string, record: Record<string, unknown>) {
  const response = await rest(table, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`insert into ${table} failed: ${response.status}`);
}

export async function patch(table: string, id: string, changes: Record<string, unknown>) {
  const response = await rest(`${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error(`update ${table} failed: ${response.status}`);
}

export async function contentBlocks(): Promise<Record<string, unknown>> {
  const list = await rows<{ key: string; value: unknown }>("content_blocks?select=key,value");
  return Object.fromEntries(list.map((b) => [b.key, b.value]));
}

export async function setContentBlock(key: string, value: unknown, by: string) {
  const response = await rest("content_blocks", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, value, updated_by: by, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error(`content_blocks upsert failed: ${response.status}`);
}
