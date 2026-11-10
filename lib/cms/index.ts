import { cookies } from "next/headers";
import { cache } from "react";
import { runtimeEnv, configured } from "../env";
import { previewMode } from "../preview";
import { applyOverrides, type Overrides } from "./core";
import { guarded, supabase } from "../service-db";
import { verifyDraftCookie, DRAFT_COOKIE } from "./signing";

/**
 * What the site renders: lib/content.ts with published edits on top, and a
 * draft's edits on top of those when this browser holds a signed preview cookie.
 */
const TTL_MS = 30_000;
let published: { at: number; values: Overrides } | null = null;

function remember(values: Overrides): Overrides {
  published = { at: Date.now(), values };
  return values;
}

async function readPublished(): Promise<Overrides> {
  // A short memo, because every page view needs this and edits are rare. A
  // publish reaches every visitor within TTL_MS.
  if (published && Date.now() - published.at < TTL_MS) return published.values;
  try {
    const response = await guarded(() => supabase("/rest/v1/content_blocks?select=key,value", { signal: AbortSignal.timeout(6000) }));
    if (!response.ok) return remember(published?.values ?? {});
    const rows = (await response.json()) as { key: string; value: unknown }[];
    published = { at: Date.now(), values: Object.fromEntries(rows.map((row) => [row.key, row.value])) };
    return published.values;
  } catch {
    // A database outage must not take the public site down: it falls back to the last good
    // copy, and remembers the failure so the next visitors are not each kept waiting.
    return remember(published?.values ?? {});
  }
}

async function readDraftChanges(): Promise<Overrides> {
  const secret = runtimeEnv().CMS_SIGNING_SECRET;
  if (!secret) return {};
  const store = await cookies();
  const raw = store.get(DRAFT_COOKIE)?.value;
  const id = raw ? await verifyDraftCookie(raw, secret, Date.now()) : null;
  if (!id) return {};
  const response = await supabase(`/rest/v1/site_drafts?id=eq.${id}&status=eq.open&select=changes`).catch(() => null);
  if (!response?.ok) return {};
  const [row] = (await response.json()) as { changes: Overrides }[];
  return row?.changes ?? {};
}

export const siteContent = cache(async () => {
  if (previewMode() || !configured()) return applyOverrides({});
  const [live, draft] = await Promise.all([readPublished(), readDraftChanges()]);
  return applyOverrides({ ...live, ...draft });
});
