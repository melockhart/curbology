import type { Metadata } from "next";
import { PortalShell, Field, Submit, SubmitNotice, type SubmitState } from "../../../components/portal";
import { A } from "../../../components/link";
import { siteContent } from "../../../lib/cms";
import { siteSettings } from "../../../lib/db";

export const metadata: Metadata = { title: "Leave a review" };

/**
 * Collect on-site, publish all.
 *
 * Every customer sees the same page and the same Google link regardless of what
 * they are about to say. There is no rating step that decides where they get
 * sent — routing happy customers to a public profile and unhappy ones to a
 * private form is review gating, and it breaks both FTC guidance and Google's
 * own policy.
 *
 * Reviews land unpublished. Tristen chooses what appears on the site, per review,
 * from the admin console — but he cannot make one disappear from the inbox.
 */
export default async function ReviewPortal({
  searchParams,
}: { searchParams: Promise<{ sent?: string }> }) {
  const { services, pages } = await siteContent();
  const { sent } = await searchParams;
  const settings = await siteSettings();
  const open = settings["portal.reviewOpen"] !== false;
  const googleUrl = typeof settings["reviews.googleUrl"] === "string"
    ? (settings["reviews.googleUrl"] as string)
    : "";

  if (!open) {
    return (
      <PortalShell
        title={pages.review.reviewsAreClosedFor}
        intro={pages.review.weAreNotCollecting}
      >
        <A href="/contact" className="underline underline-offset-4">{pages.review.getInTouchInstead}</A>
      </PortalShell>
    );
  }

  if (sent === "ok" || sent === "preview") {
    return (
      <PortalShell
        title={pages.review.thankYouWeHave}
        intro={pages.review.tristenReadsEveryOne}
      >
        <SubmitNotice state={sent as SubmitState} />
      {/*
        Offered to everyone, identically, and after the form rather than instead
        of it — so it is a second place to leave the same review, not a fork in
        the road based on sentiment.
      */}
      <div className="mt-12 border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl font-bold">{pages.review.wouldYouPostIt}</h2>
        <p className="mt-2 text-[color:var(--muted)]">
          {pages.review.itHelpsOtherPeople}
        </p>
        {/*
          The link comes from Settings, and is absent until it is set. Curbology's
          Place ID is not published anywhere in the capture, so the alternative
          was pointing people somewhere wrong.
        */}
        {googleUrl ? (
          <p className="mt-4">
            <A
              href={googleUrl}
              className="btn btn--ink"
              rel="noopener"
            >
              {pages.review.leaveAGoogleReview}
            </A>
          </p>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            <A href="/contact" className="underline underline-offset-4">
              {pages.review.askUsForThe}
            </A>{" "}
            {pages.review.weAreStillSetting}
          </p>
        )}
      </div>
        <p className="mt-10">
          <A href="/" className="underline underline-offset-4">{pages.review.backToTheSite}</A>
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title={pages.review.howDidWeDo}
      intro={pages.review.goodOrBadWe}
    >
      <SubmitNotice state={sent as SubmitState} />
      <form action="/api/reviews" method="post" className="space-y-5">
        <Field name="name" label={pages.review.yourName} required autoComplete="name" />
        <Field name="email" label={pages.review.email} type="email" required autoComplete="email"
          hint={pages.review.soWeCanFollow} />

        <fieldset>
          <legend className="font-medium">{pages.review.howWouldYouRate}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-ink/25 px-4">
                <input type="radio" name="rating" value={n} required />
                <span>{n} {n === 1 ? "star" : "stars"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="service" className="block font-medium">{pages.review.whatDidWeDo}</label>
          <select id="service" name="service"
            className="mt-2 min-h-[44px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2">
            <option value="">{pages.review.selectAService}</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="body" className="block font-medium">{pages.review.yourReview}</label>
          <textarea id="body" name="body" rows={5} required
            placeholder={pages.review.whatWeDidHow}
            className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
        </div>

        <div>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consent" value="yes" className="mt-1" />
            <span className="text-sm">
              {pages.review.youMayPublishMy}
            </span>
          </label>
        </div>

        <Submit>{pages.review.sendMyReview}</Submit>
      </form>

      {/*
        Offered to everyone, identically, and after the form rather than instead
        of it — so it is a second place to leave the same review, not a fork in
        the road based on sentiment.
      */}
      <div className="mt-12 border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl font-bold">{pages.review.wouldYouPostIt}</h2>
        <p className="mt-2 text-[color:var(--muted)]">
          {pages.review.itHelpsOtherPeople}
        </p>
        {/*
          The link comes from Settings, and is absent until it is set. Curbology's
          Place ID is not published anywhere in the capture, so the alternative
          was pointing people somewhere wrong.
        */}
        {googleUrl ? (
          <p className="mt-4">
            <A
              href={googleUrl}
              className="btn btn--ink"
              rel="noopener"
            >
              {pages.review.leaveAGoogleReview}
            </A>
          </p>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            <A href="/contact" className="underline underline-offset-4">
              {pages.review.askUsForThe}
            </A>{" "}
            {pages.review.weAreStillSetting}
          </p>
        )}
      </div>
    </PortalShell>
  );
}
