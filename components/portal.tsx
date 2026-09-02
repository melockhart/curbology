import { A } from "./link";
import { business } from "../lib/content";

/**
 * The shell for pages someone arrives at from an email, a text or a QR code with
 * exactly one task in mind: leave a review, book a testimonial, unsubscribe.
 *
 * Branded but deliberately not the full site — no nav. Someone who clicked
 * "unsubscribe" should not be sold four services on the way. There is one route
 * back to the site, at the bottom, for anyone who wants it.
 */
export function PortalShell({
  title, intro, children,
}: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="ground-paper flex min-h-screen flex-col">
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
        <h1 className="text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-[color:var(--muted)]">{intro}</p>}
        <div className="mt-10">{children}</div>
      </main>

      <footer className="ground-ink bg-ink text-paper">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 text-sm">
          <p>
            {business.name} · {business.serviceArea.county}, {business.serviceArea.state}
          </p>
          <p className="mt-2">
            <A href={business.phone.href} className="underline underline-offset-4">
              {business.phone.display}
            </A>
            {" · "}
            <A href="/" className="underline underline-offset-4">Back to the site</A>
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
