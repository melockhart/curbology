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
          <A href="/" className="inline-flex items-center gap-3" aria-label={`${business.name} — home`}>
            <svg width="30" height="30" viewBox="0 0 34 34" aria-hidden="true" fill="none">
              <path d="M4 16.5 17 6l13 10.5" stroke="#1A202C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 15v11.5h19V15" stroke="#1A202C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 20.5c1.6 1.7 2.5 3 2.5 4.2a2.5 2.5 0 1 1-5 0c0-1.2.9-2.5 2.5-4.2Z" fill="#1A202C" />
            </svg>
            <span className="font-display text-base font-bold uppercase tracking-tight text-ink">Curbology</span>
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
    <button
      type="submit"
      className="min-h-[44px] w-full rounded-full bg-ink px-7 py-3 font-medium text-paper transition-colors hover:bg-slate"
    >
      {children}
    </button>
  );
}
