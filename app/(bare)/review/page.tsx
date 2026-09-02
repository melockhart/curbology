import type { Metadata } from "next";
import { PortalShell, Field, Submit } from "../../../components/portal";
import { A } from "../../../components/link";
import { services } from "../../../lib/content";

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
export default function ReviewPortal() {
  return (
    <PortalShell
      title="How did we do?"
      intro="Good or bad, we want to hear it. It takes about a minute."
    >
      <form action="/api/reviews" method="post" className="space-y-5">
        <Field name="name" label="Your name" required autoComplete="name" />
        <Field name="email" label="Email" type="email" required autoComplete="email"
          hint="So we can follow up if something went wrong. Not published." />

        <fieldset>
          <legend className="font-medium">How would you rate the work?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {[5, 4, 3, 2, 1].map((n) => (
              <label key={n} className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-ink/25 px-4">
                <input type="radio" name="rating" value={n} required />
                <span>{n} {n === 1 ? "star" : "stars"}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="service" className="block font-medium">What did we do?</label>
          <select id="service" name="service"
            className="mt-2 min-h-[44px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2">
            <option value="">Select a service</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="body" className="block font-medium">Your review</label>
          <textarea id="body" name="body" rows={5} required
            placeholder="What we did, how it went, anything we could do better."
            className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
        </div>

        <div>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="consent" value="yes" className="mt-1" />
            <span className="text-sm">
              You may publish my first name and review on the Curbology website.
            </span>
          </label>
        </div>

        <Submit>Send my review</Submit>
      </form>

      {/*
        Offered to everyone, identically, and after the form rather than instead
        of it — so it is a second place to leave the same review, not a fork in
        the road based on sentiment.
      */}
      <div className="mt-12 border-t border-ink/10 pt-8">
        <h2 className="font-display text-xl font-bold">Would you post it on Google too?</h2>
        <p className="mt-2 text-[color:var(--muted)]">
          It helps other people in Oakland County find us — whatever you have to say.
        </p>
        {/*
          TODO: the real Google review URL needs Curbology's Place ID. Not
          published anywhere in the capture, so the link is not rendered rather
          than pointed somewhere wrong.
        */}
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          <A href="/contact" className="underline underline-offset-4">
            Ask us for the Google link
          </A>{" "}
          — we are still setting it up.
        </p>
      </div>
    </PortalShell>
  );
}
