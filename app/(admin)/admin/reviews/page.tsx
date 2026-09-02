import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured } from "../../../../lib/env";
import { listReviews } from "../../../../lib/db";
import { AdminShell, NotConfigured, Empty, Pill, age } from "../../../../components/admin";

export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

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
export default async function ReviewsPage() {
  const user = await requireUser();
  if (!configured()) return <AdminShell title="Reviews" user={user}><NotConfigured /></AdminShell>;

  const reviews = await listReviews();
  const live = reviews.filter((r) => r.published).length;

  return (
    <AdminShell
      title="Reviews"
      intro={reviews.length ? `${reviews.length} received · ${live} showing on the site` : undefined}
      user={user}
    >
      {reviews.length === 0 ? (
        <Empty>No reviews yet. They arrive here unpublished — nothing reaches the site until you say so.</Empty>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-ink/10 bg-paper p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display text-lg font-bold">{r.name}</span>
                <span aria-label={`${r.rating} out of 5`} className="tracking-widest">
                  {"★".repeat(r.rating)}<span className="text-ink/25">{"★".repeat(5 - r.rating)}</span>
                </span>
                {r.service && <Pill tone="muted">{r.service}</Pill>}
                <Pill tone={r.published ? "live" : "new"}>{r.published ? "On the site" : "Not published"}</Pill>
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

              <form action="/api/admin/review" method="post" className="mt-5 space-y-3 border-t border-ink/10 pt-5">
                <input type="hidden" name="id" value={r.id} />
                <div>
                  <label htmlFor={`reply-${r.id}`} className="block text-sm font-medium">
                    Your reply <span className="font-normal text-[color:var(--muted)]">— public if the site shows it</span>
                  </label>
                  <textarea
                    id={`reply-${r.id}`} name="owner_reply" rows={2} defaultValue={r.owner_reply ?? ""}
                    className="mt-1 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="published" value="yes" defaultChecked={r.published} />
                    Show on the site
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="archived" value="yes" defaultChecked={r.status === "archived"} />
                    Archive <span className="text-[color:var(--muted)]">(leaves the queue, stays readable)</span>
                  </label>
                  <button className="ml-auto min-h-[38px] rounded-lg border border-ink/25 px-4 text-sm hover:bg-ink/5">Save</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
