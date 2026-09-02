import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listReviews } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button,
  SaveBanner, age, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Reviews" };

/**
 * The review inbox.
 *
 * The full text is always shown, never a truncated preview — the decision to
 * publish depends on exactly the part a preview would cut.
 *
 * Publishing is per review and reversible. Nothing here deletes: a review can
 * be archived so it leaves the queue, and it stays readable. Curation is
 * choosing what the site shows; suppression is making it disappear, and this
 * screen deliberately only does the first.
 */
export default async function ReviewsPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Reviews" /><NotConfigured /></div>;
  }

  const reviews = await listReviews();
  const live = reviews.filter((r) => r.published).length;
  const average = reviews.length
    ? (reviews.reduce((t, r) => t + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Work"
        title="Reviews"
        intro="Every review lands here whatever it says. Nothing is routed by its rating, and nothing reaches the site until you publish it."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Received" value={reviews.length} />
        <Stat label="Showing on the site" value={live} />
        <Stat label="Average" value={average} hint={reviews.length ? "out of 5" : undefined} />
      </div>

      {reviews.length === 0 ? (
        <Empty>No reviews yet. They arrive here unpublished — nothing reaches the site until you say so.</Empty>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-lg font-bold">{r.name}</span>
                  {/* Outline glyphs rather than a faded fill. A 25%-ink star is
                      1.69:1 — invisible to anyone the rating is hardest to read
                      for, on the one element that carries the whole judgement. */}
                  <span aria-label={`${r.rating} out of 5`} className="tracking-widest">
                    {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                  </span>
                  {r.service && <Pill tone="muted">{r.service}</Pill>}
                  <Pill tone={r.published ? "default" : "accent"}>
                    {r.published ? "On the site" : "Not published"}
                  </Pill>
                  {r.status === "archived" && <Pill tone="muted">archived</Pill>}
                  <span className="ml-auto text-sm text-[color:var(--muted)]">{age(r.created_at)} ago</span>
                </div>

                {/* Full text, always. */}
                <p className="mt-4 whitespace-pre-wrap">{r.body}</p>

                {!r.consented && (
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    They did not tick the box allowing their name and review on the site.
                    Ask before publishing this one.
                  </p>
                )}

                <form action="/api/admin/review" method="post"
                  className="mt-5 space-y-3 border-t border-[color:var(--console-line)] pt-5">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label htmlFor={`reply-${r.id}`} className="block text-sm font-medium">
                      Your reply{" "}
                      <span className="font-normal text-[color:var(--muted)]">— public if the site shows it</span>
                    </label>
                    <textarea id={`reply-${r.id}`} name="owner_reply" rows={2}
                      defaultValue={r.owner_reply ?? ""} className={fieldCls} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="published" value="yes" defaultChecked={r.published} />
                      Show on the site
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="archived" value="yes" defaultChecked={r.status === "archived"} />
                      Archive{" "}
                      <span className="text-[color:var(--muted)]">(leaves the queue, stays readable)</span>
                    </label>
                    <span className="ml-auto"><Button>Save</Button></span>
                  </div>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
