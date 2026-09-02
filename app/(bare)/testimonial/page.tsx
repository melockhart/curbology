import type { Metadata } from "next";
import { PortalShell, Field, Submit, SubmitNotice, type SubmitState } from "../../../components/portal";
import { A } from "../../../components/link";
import { siteSettings } from "../../../lib/db";

export const metadata: Metadata = { title: "Book a video testimonial" };

/**
 * Scaffolded, per the brief: request → confirm → record → received.
 *
 * No third-party calendar. The customer offers times in their own words and
 * Tristen confirms one from the admin console. Wiring a booking service is a
 * decision nobody has made yet, and guessing it would mean an integration to
 * unpick later. Writes to `bookings`.
 */
export default async function TestimonialPortal({
  searchParams,
}: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const settings = await siteSettings();
  if (settings["portal.testimonialOpen"] === false) {
    return (
      <PortalShell
        title="Not booking right now"
        intro="We have paused filming for a bit. The page stays up so the link we sent you still works — ask us and we will let you know when it reopens."
      >
        <A href="/contact" className="underline underline-offset-4">Get in touch</A>
      </PortalShell>
    );
  }

  if (sent === "ok" || sent === "preview") {
    return (
      <PortalShell
        title="Got it — we will be in touch"
        intro="Tristen will come back to you with a time from the ones you offered. Nothing is booked until he does."
      >
        <SubmitNotice state={sent as SubmitState} />
        <p className="mt-8">
          <A href="/" className="underline underline-offset-4">Back to the site</A>
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title="Say it on camera?"
      intro="A short video — a minute, maybe two — about the work we did. We come to you, or you record it on your phone. Your call."
    >
      <SubmitNotice state={sent as SubmitState} />
      <form action="/api/bookings" method="post" className="space-y-5">
        <Field name="name" label="Your name" required autoComplete="name" />
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field name="phone" label="Phone" type="tel" required autoComplete="tel" />

        <fieldset>
          <legend className="font-medium">How would you rather do it?</legend>
          <div className="mt-3 space-y-2">
            {[
              ["in-person", "You come to me"],
              ["self-record", "I will record it myself on my phone"],
              ["either", "Either is fine"],
            ].map(([value, label]) => (
              <label key={value} className="flex min-h-[44px] cursor-pointer items-center gap-3">
                <input type="radio" name="format" value={value} required />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="slots" className="block font-medium">
            When suits you? <span className="text-[color:var(--muted)]" aria-hidden="true">*</span>
          </label>
          <p id="slots-hint" className="mt-1 text-sm text-[color:var(--muted)]">
            In your own words — &ldquo;weekday evenings&rdquo; is as useful as a date.
          </p>
          <textarea
            id="slots" name="slots" rows={3} required aria-describedby="slots-hint"
            className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block font-medium">Anything else?</label>
          <textarea id="notes" name="notes" rows={3}
            className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
        </div>

        <Submit>Request a time</Submit>
        <p className="text-sm text-[color:var(--muted)]">
          We will confirm by email or text. Nothing is booked until we do.
        </p>
      </form>
    </PortalShell>
  );
}
