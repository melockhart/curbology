import type { Metadata } from "next";
import { business } from "../../../lib/content";
import { Button, Section, Eyebrow } from "../../../components/ui";

export const metadata: Metadata = { title: "Reviews" };

/**
 * Renders reviews where `published = true`, set by Tristen per review in the
 * admin console. Nothing a stranger writes reaches the site on its own.
 *
 * The list is empty until Supabase exists. The aggregate below is the one review
 * fact that was actually captured — the embedded Google badge. No individual
 * review text or reviewer names were captured, so none are shown. A quote with no
 * attributable author does not go on a page.
 */
export default function ReviewsPage() {
  const published: Array<{ id: string; author: string; body: string; service: string }> = [];

  return (
    <>
      <Section ground="teal">
        <h1 className="max-w-3xl text-5xl">What our customers say</h1>
        <p className="mt-6 text-lg">
          {business.googleRating.value.toFixed(1)} on Google, from{" "}
          {business.googleRating.count} reviews.
        </p>
      </Section>

      <Section>
        {published.length === 0 ? (
          <div className="max-w-xl">
            <Eyebrow>Coming soon</Eyebrow>
            <h2 className="text-3xl">Reviews are moving here</h2>
            <p className="mt-4 text-slate">
              We are collecting reviews on our own site so you can read them in
              full. In the meantime, our {business.googleRating.value.toFixed(1)}{" "}
              rating on Google comes from {business.googleRating.count} customers.
            </p>
          </div>
        ) : (
          <ul className="grid gap-10 md:grid-cols-2">
            {published.map((r) => (
              <li key={r.id} className="border-t border-ink/10 pt-6">
                <blockquote className="text-lg">{r.body}</blockquote>
                <p className="mt-4 text-slate">
                  {r.author} · {r.service}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Everyone gets the same route. No rating gate, ever. */}
      <Section ground="ink">
        <h2 className="max-w-2xl text-4xl text-paper">Worked with us?</h2>
        <p className="mt-4 max-w-xl text-white/75">
          We would like to hear how it went — good or bad.
        </p>
        <div className="mt-8"><Button href="/review">Leave a review</Button></div>
      </Section>
    </>
  );
}
