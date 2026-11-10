import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listReviews, type Review } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Empty, Card, Stat, Pill, Button,
  SaveBanner, age, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Reviews" };

const DAY = 86_400_000;

/** Where each review stands on the public site, by the same rule lib/v2/render.ts applies. */
function siteStates(reviews: Review[]): Map<string, string> {
  const now = Date.now();
  return new Map(reviews.map((r) => {
    if (!r.consented) return [r.id, "Rating counts, words private"];
    const posts = new Date(r.created_at).getTime() + 2 * DAY;
    if (r.rating <= 2 && posts > now) return [r.id, `Posts in ${Math.max(1, Math.ceil((posts - now) / 36e5))}h`];
    return [r.id, "On the site"];
  }));
}

/**
 * The review inbox.
 *
 * The full text is always shown, never a truncated preview — the decision to
 * publish depends on exactly the part a preview would cut.
 *
 * What the site shows follows the approved rule, not a per-review switch: 3 to 5
 * stars post straight away, 1 and 2 stars after 48 hours, words only with the
 * customer's consent, and every rating counts. Marking one done takes it off this
 * list and nothing else, so no rating can be hidden from the public by hand.
 */
export default async function ReviewsPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Work" title="Reviews" /><NotConfigured /></div>;
  }

  const reviews = await listReviews();
  const states = siteStates(reviews);
  const live = reviews.filter((r) => states.get(r.id) === "On the site").length;
  const average = reviews.length
    ? (reviews.reduce((t, r) => t + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Work"
        title="Reviews"
        intro="Every review lands here whatever it says. 3 to 5 stars post straight away. 1 and 2 stars post after 48 hours, so you can reach the customer first. Words show only if the customer agreed."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Received" value={reviews.length} />
        <Stat label="Showing on the site" value={live} />
        <Stat label="Average" value={average} hint={reviews.length ? "out of 5" : undefined} />
      </div>

      {reviews.length === 0 ? (
        <Empty>No reviews yet. They arrive here the moment a customer sends one.</Empty>
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
                  <Pill tone={states.get(r.id) === "On the site" ? "success" : "accent"}>{states.get(r.id)}</Pill>
                  {r.status === "archived" && <Pill tone="muted">Done</Pill>}
                  <span className="ml-auto text-sm text-[color:var(--muted)]">{age(r.created_at)} ago</span>
                </div>

                {/* Full text, always. */}
                <p className="mt-4 whitespace-pre-wrap">{r.body}</p>

                {!r.consented && (
                  <p className="mt-3 text-sm text-[color:var(--muted)]">
                    They did not tick the box allowing their name and words on the site, so only
                    their rating counts in the public numbers.
                  </p>
                )}

                <form action="/api/admin/review" method="post"
                  className="mt-5 space-y-3 border-t border-[color:var(--console-line)] pt-5">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label htmlFor={`reply-${r.id}`} className="block text-sm font-medium">
                      Your reply{" "}
                      <span className="font-normal text-[color:var(--muted)]">— shown beside the review on the site</span>
                    </label>
                    <textarea id={`reply-${r.id}`} name="owner_reply" rows={2}
                      defaultValue={r.owner_reply ?? ""} className={fieldCls} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="archived" value="yes" defaultChecked={r.status === "archived"} />
                      Done{" "}
                      <span className="text-[color:var(--muted)]">(off this list, still on the site)</span>
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
