import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { publishedReviews } from "../../../lib/db";
import { Button, Section, Eyebrow } from "../../../components/ui";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/reviews", { title: "Reviews" });
}

/**
 * Renders reviews where `published = true`, set by Tristen per review in the
 * admin console. Nothing a stranger writes reaches the site on its own.
 *
 * The list is empty until Supabase exists. The aggregate below is the one review
 * fact that was actually captured — the embedded Google badge. No individual
 * review text or reviewer names were captured, so none are shown. A quote with no
 * attributable author does not go on a page.
 */
export default async function ReviewsPage() {
  const { business, pages } = await siteContent();
  // Only rows the owner marked published in the console. Returns [] with no
  // database, so the page renders its empty state rather than throwing.
  const published = await publishedReviews();

  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">{pages.reviews.whatOurCustomersSay}</h1>
        <p className="mt-6 text-lg">
          {business.googleRating.value.toFixed(1)} {pages.reviews.onGoogleFrom}{" "}
          {business.googleRating.count} {pages.reviews.reviews}
        </p>
      </Section>

      <Section cut="l" ground="shallow">
        {published.length === 0 ? (
          <div className="max-w-xl">
            <Eyebrow>{pages.reviews.comingSoon}</Eyebrow>
            <h2 className="text-3xl">{pages.reviews.reviewsAreMovingHere}</h2>
            <p className="mt-4 text-[color:var(--muted)]">
              {pages.reviews.weAreCollectingReviews}{" "}{business.googleRating.value.toFixed(1)}{" "}
              {pages.reviews.ratingOnGoogleComes}{" "}{business.googleRating.count} {pages.reviews.customers}
            </p>
          </div>
        ) : (
          <ul className="grid gap-10 md:grid-cols-2">
            {published.map((r) => (
              <li key={r.id} className="border-t border-ink/10 pt-6">
                <blockquote className="text-lg">{r.body}</blockquote>
                {r.owner_reply && (
                  <p className="mt-3 border-l-2 border-teal pl-4 text-[color:var(--muted)]">
                    <span className="font-medium text-ink">{pages.reviews.curbology}</span> {r.owner_reply}
                  </p>
                )}
                <p className="mt-4 text-[color:var(--muted)]">
                  {r.name}{r.service ? ` · ${r.service}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Everyone gets the same route. No rating gate, ever. */}
      <Section cut="r" ground="ink">
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">{pages.reviews.workedWithUs}</h2>
        <p className="mt-4 max-w-xl text-white/75">
          {pages.reviews.weWouldLikeTo}
        </p>
        <div className="mt-8"><Button href="/review">{pages.reviews.leaveAReview}</Button></div>
      </Section>
    </>
  );
}
