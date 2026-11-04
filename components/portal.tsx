import { A } from "./link";
import { siteContent } from "../lib/cms";

/**
 * The shell for pages someone arrives at from an email, a text or a QR code with
 * exactly one task in mind: leave a review, book a testimonial, unsubscribe.
 *
 * Branded but deliberately not the full site — no nav. Someone who clicked
 * "unsubscribe" should not be sold four services on the way. There is one route
 * back to the site, at the bottom, for anyone who wants it.
 */
export async function PortalShell({
  title, intro, children,
}: { title: string; intro?: string; children: React.ReactNode }) {
  const { business, pages } = await siteContent();
  return (
    <div className="ground-paper flex min-h-screen flex-col bg-paper">
      <header className="bg-teal">
        <div className="mx-auto w-full max-w-2xl px-6 py-5">
          <A href="/" aria-label={`${business.name} — home`}>
            {/* The real badge. Dark mark, so it lives on the teal masthead. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/curbology-logo.png"
              alt="Curbology Exterior Services"
              width={63}
              height={40}
              style={{ height: 40, width: "auto" }}
            />
          </A>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
        <h1 data-wash-type className="text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-[color:var(--muted)]">{intro}</p>}
        <div className="mt-10">{children}</div>
      </main>

      <footer className="ground-ink bg-ink text-stone-050">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 text-sm">
          <p>
            {business.name} · {business.serviceArea.county}, {business.serviceArea.state}
          </p>
          <p className="mt-2">
            <A href={business.phone.href} className="underline underline-offset-4">
              {business.phone.display}
            </A>
            {" · "}
            <A href="/" className="underline underline-offset-4">{pages.portal.backToTheSite}</A>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function Field({
  name, label, type = "text", required = false, autoComplete, hint,
}: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string; hint?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block font-medium">
        {label} {required && <span className="text-[color:var(--muted)]" aria-hidden="true">*</span>}
      </label>
      {hint && <p id={`${name}-hint`} className="mt-1 text-sm text-[color:var(--muted)]">{hint}</p>}
      <input
        id={name} name={name} type={type} required={required} autoComplete={autoComplete}
        aria-describedby={hint ? `${name}-hint` : undefined}
        className="mt-2 min-h-[44px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
      />
    </div>
  );
}

export function Submit({ children }: { children: React.ReactNode }) {
  // ink on white — 16.32:1.
  return (
    <button type="submit" className="btn btn--ink w-full">
      {children}
    </button>
  );
}

/**
 * What happened to the thing you just submitted.
 *
 * Every form on this site posts, redirects, and comes back with a state in the
 * query string. Until this existed, nothing rendered that state — you pressed
 * Send, landed on an identical empty form, and had no way to tell whether it
 * had worked. The redirect is right (it stops a refresh re-submitting); the
 * silence was the bug.
 */
export type SubmitState = "ok" | "preview" | "missing" | "failed" | "unconfigured" | undefined;

export async function SubmitNotice({ state }: { state: SubmitState }) {
  const { pages } = await siteContent();
  const messages: Partial<Record<NonNullable<SubmitState>, { tone: string; text: string }>> = pages.portal.MESSAGES;
  const message = state ? messages[state] : undefined;
  if (!message) return null;
  return (
    <p
      role="status"
      className={`mb-8 rounded-lg border px-4 py-3 ${
        message.tone === "good" ? "border-ink/20 bg-teal/15" : "border-[#7a2e12] bg-[#7a2e12]/10"
      }`}
    >
      {message.text}
    </p>
  );
}
