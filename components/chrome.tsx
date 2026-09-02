import { business, nav } from "../lib/content";
import { A } from "./link";

/**
 * The mark. Client confirmed 2026-09-02 that the header badge is canonical and
 * the footer's blue "Curbology Cleaning" droplet is retired — so there is one
 * mark on this site, not two.
 *
 * Drawn rather than linked: no logo source file was ever captured, only
 * rasterised pixels inside screenshots. Replace with the real asset when Tristen
 * supplies it. This is a stand-in that is honestly a stand-in.
 */
function Mark({ onDark = false }: { onDark?: boolean }) {
  const stroke = onDark ? "#FFFFFF" : "#1A202C";
  return (
    <span className="inline-flex items-center gap-3">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" fill="none">
        <path d="M4 16.5 17 6l13 10.5" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 15v11.5h19V15" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 20.5c1.6 1.7 2.5 3 2.5 4.2a2.5 2.5 0 1 1-5 0c0-1.2.9-2.5 2.5-4.2Z" fill={stroke} />
      </svg>
      <span
        className={`font-display text-lg font-bold uppercase tracking-tight ${onDark ? "text-paper" : "text-ink"}`}
      >
        Curbology
      </span>
    </span>
  );
}

export function Nav() {
  return (
    <header className="bg-teal">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5">
        <A href="/" className="mr-auto" aria-label={`${business.name} — home`}>
          <Mark />
        </A>

        {/* Click-to-call sits in the header on the live site and stays there.
            For a local service business it is the highest-intent action there is. */}
        <A href={business.phone.href} className="font-medium text-ink underline underline-offset-4">
          {business.phone.display}
        </A>

        <nav aria-label="Main">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <A href={item.href} className="text-ink hover:underline hover:underline-offset-4">
                  {item.label}
                </A>
              </li>
            ))}
          </ul>
        </nav>

        <A
          href="/contact"
          className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-6 py-3 font-medium text-paper transition-colors hover:bg-slate"
        >
          Get a free quote
        </A>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div>
            <Mark onDark />
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Exterior cleaning across {business.serviceArea.county},{" "}
              {business.serviceArea.state}.
            </p>
          </div>

          <div className="text-sm">
            <h2 className="mb-3 font-display text-base">Get in touch</h2>
            <p>
              <A href={business.phone.href} className="underline underline-offset-4">
                {business.phone.display}
              </A>
            </p>
            <p className="mt-1">
              <A href="/contact" className="underline underline-offset-4">
                Request a free quote
              </A>
            </p>
            {/*
              No email and no postal address render here, because the live site's
              were placeholders: hello@curbology.com is on a domain the business
              does not own and was never linked with mailto:, and "123 Exterior
              Way" is not an address. The regions are removed rather than left as
              empty lines. The postal address returns when Tristen supplies the
              registered one — the email shells are blocked on it anyway.

              Six social icons are also absent: every one linked to a platform
              homepage rather than a Curbology profile. A dead icon is worse than
              no icon. They return when there are real URLs.
            */}
          </div>

          <div className="text-sm">
            <h2 className="mb-3 font-display text-base">Services</h2>
            <ul className="space-y-1">
              <li><A href="/services/pressure-washing" className="hover:underline">Pressure Washing</A></li>
              <li><A href="/services/house-siding-washing" className="hover:underline">House &amp; Siding Soft Wash</A></li>
              <li><A href="/services/gutter-cleaning" className="hover:underline">Gutter Cleaning &amp; Brightening</A></li>
              <li><A href="/services/roof-cleaning" className="hover:underline">Roof Cleaning</A></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm text-white/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <p className="flex gap-4">
            <A href="/privacy" className="hover:underline">Privacy</A>
            <A href="/terms" className="hover:underline">Terms</A>
            <A href="/accessibility" className="hover:underline">Accessibility</A>
          </p>
        </div>
      </div>
    </footer>
  );
}
