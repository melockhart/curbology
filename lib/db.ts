import { prefixed } from "./table-prefix";
import { guarded } from "./service-db";
import { runtimeEnv, configured } from "./env";
import type { Session } from "./session";
import * as preview from "./preview";

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
  return guarded(() => fetch(`${SUPABASE_URL}/rest/v1/${prefixed(path)}`, {
    signal: init.signal ?? AbortSignal.timeout(4000),
    ...init,
    headers: {
      apikey: SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  }));
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
  id: string; created_at: string; updated_at?: string; name: string; email: string; phone: string | null;
  address: string | null; town: string | null; service: string | null; message: string | null;
  photo_paths: string[]; source_page: string | null;
  status: "new" | "contacted" | "quoted" | "won" | "lost" | "spam";
  quoted_amount: number | null; notes: string | null;
};

export type Review = {
  id: string; created_at: string; updated_at?: string; name: string; email: string; rating: number; body: string;
  service: string | null; consented: boolean; published: boolean; owner_reply: string | null;
  status: "new" | "replied" | "flagged" | "archived";
};

export type Booking = {
  id: string; created_at: string; updated_at?: string; name: string; email: string; phone: string | null;
  format: "in-person" | "self-record" | "either" | null;
  requested_slots: string | null; confirmed_slot: string | null;
  state: "requested" | "confirmed" | "recorded" | "received" | "published" | "declined" | "no-show";
  video_url: string | null; notes: string | null;
};

export const listLeads = async () =>
  preview.previewMode()
    ? preview.previewLeads.filter((l) => ["new", "contacted", "quoted"].includes(l.status))
    : rows<Lead>("leads?select=*&order=created_at.asc&status=in.(new,contacted,quoted)");
export const listAllLeads = async () =>
  preview.previewMode() ? preview.previewLeads : rows<Lead>("leads?select=*&order=created_at.desc");
export const listReviews = async () =>
  preview.previewMode() ? preview.previewReviews : rows<Review>("reviews?select=*&order=created_at.desc");
export const listBookings = async () =>
  preview.previewMode() ? preview.previewBookings : rows<Booking>("bookings?select=*&order=created_at.desc");

/** Published reviews, for the public /reviews page. */
export const publishedReviews = async () =>
  preview.previewMode()
    ? preview.previewReviews.filter((r) => r.published)
    : rows<Review>("reviews?select=*&published=is.true&order=created_at.desc");

/** Thrown instead of writing, so a route reports it the same way it reports any
 *  other refusal rather than pretending the save worked. */
export class PreviewWrite extends Error {
  constructor() {
    super("This is a preview — the form works, but there is no database behind it yet.");
    this.name = "PreviewWrite";
  }
}

export async function insert(table: string, record: Record<string, unknown>) {
  if (preview.previewMode()) throw new PreviewWrite();
  const response = await rest(table, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`insert into ${table} failed: ${response.status}`);
}

export async function contentBlocks(): Promise<Record<string, unknown>> {
  if (preview.previewMode()) return preview.previewContent;
  const list = await rows<{ key: string; value: unknown }>("content_blocks?select=key,value");
  return Object.fromEntries(list.map((b) => [b.key, b.value]));
}

/* ------------------------------------------------------------------ the spine */

export type TeamMember = {
  id: string; created_at: string; updated_at: string; name: string;
  role_title: string | null; bio: string | null; photo_url: string | null;
  sort_order: number; is_published: boolean;
};

export type Activity = {
  id: string; created_at: string; actor_email: string | null;
  entity: string; entity_id: string | null; verb: string;
  detail: Record<string, unknown>;
};

export type AdminUser = {
  id: string; email: string | null; display_name: string | null;
  is_suspended: boolean; created_at: string; last_sign_in_at: string | null;
  roles: string[];
};

export type SeoOverride = {
  path: string; title: string | null; description: string | null;
  noindex: boolean; updated_at: string; updated_by: string | null;
};

export type Redirect = {
  id: string; created_at: string; from_path: string; to_path: string;
  permanent: boolean; hits: number; is_active: boolean;
};

/** The people the public about page shows. Draft rows never leave the console. */
export const publishedTeam = async () =>
  preview.previewMode()
    ? preview.previewTeam.filter((t) => t.is_published)
    : rows<TeamMember>("team_members?select=*&is_published=is.true&order=sort_order.asc,created_at.asc");
export const listTeam = async () =>
  preview.previewMode()
    ? preview.previewTeam
    : rows<TeamMember>("team_members?select=*&order=sort_order.asc,created_at.asc");
export const listActivity = async (limit = 200) =>
  preview.previewMode()
    ? preview.previewActivity.slice(0, limit)
    : rows<Activity>(`admin_activity?select=*&order=created_at.desc&limit=${limit}`);
export const listSeo = async () =>
  preview.previewMode() ? preview.previewSeo : rows<SeoOverride>("seo_overrides?select=*&order=path.asc");
export const listRedirects = async () =>
  preview.previewMode() ? preview.previewRedirects : rows<Redirect>("redirects?select=*&order=created_at.desc");

export async function siteSettings(): Promise<Record<string, unknown>> {
  if (preview.previewMode()) return preview.previewSettings;
  const list = await rows<{ key: string; value: unknown }>("site_settings?select=key,value");
  return Object.fromEntries(list.map((b) => [b.key, b.value]));
}

/* --------------------------------------------------------------- the writes */

/**
 * Every privileged write goes through here, and it is the one place in the app
 * that does NOT use the service key.
 *
 * The call carries the signed-in person's own access token, so inside the
 * function `auth.uid()` is them and `require_admin()` is a real check rather
 * than a formality. A route handler that forgot its own guard would still be
 * refused by the database.
 */
export async function rpc(name: string, args: Record<string, unknown>, session: Session): Promise<void> {
  // In preview there is nothing to write to. The form still round-trips so the
  // interaction can be walked through; the banner it returns to says plainly
  // that nothing was saved, rather than implying it was.
  if (preview.previewMode()) throw new PreviewWrite();
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = runtimeEnv();
  if (!SUPABASE_URL) throw new Error("Supabase is not configured");
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "SUPABASE_PUBLISHABLE_KEY is not set. Reads work without it; writes go through the " +
        "database's own admin check, which needs the person's token and this key together.",
    );
  }
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${prefixed(`rpc/${name}`)}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    const body = await response.text();
    // PostgREST hands back the raise message; it is written for a person, so it
    // is worth surfacing rather than replacing with "something went wrong".
    let message = body;
    try { message = (JSON.parse(body) as { message?: string }).message ?? body; } catch { /* not json */ }
    throw new Error(message || `${name} failed: ${response.status}`);
  }
}

/** Reads that only an admin may make, made as that admin. */
export async function rpcRows<T>(name: string, args: Record<string, unknown>, session: Session): Promise<T[]> {
  if (preview.previewMode()) return name === "list_users" ? (preview.previewUsers as unknown as T[]) : [];
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = runtimeEnv();
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${prefixed(`rpc/${name}`)}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) return [];
    return (await response.json()) as T[];
  } catch {
    return [];
  }
}

/** The redirect table, consulted before a 404 is rendered. */
export async function findRedirect(path: string): Promise<Redirect | null> {
  if (preview.previewMode()) {
    return preview.previewRedirects.find((r) => r.is_active && r.from_path === path) ?? null;
  }
  const list = await rows<Redirect>(
    `redirects?select=*&is_active=is.true&from_path=eq.${encodeURIComponent(path)}&limit=1`,
  );
  return list[0] ?? null;
}

/** Counting a redirect's use. Best-effort: a failed counter must never cost
 *  the visitor the redirect they came for. */
export async function countRedirectHit(fromPath: string): Promise<void> {
  if (preview.previewMode() || !configured()) return;
  try {
    await rest("rpc/redirect_hit", { method: "POST", body: JSON.stringify({ _from: fromPath }) });
  } catch { /* the redirect matters, the counter does not */ }
}

export async function seoFor(path: string): Promise<SeoOverride | null> {
  if (preview.previewMode()) return preview.previewSeo.find((o) => o.path === path) ?? null;
  const list = await rows<SeoOverride>(
    `seo_overrides?select=*&path=eq.${encodeURIComponent(path)}&limit=1`,
  );
  return list[0] ?? null;
}
