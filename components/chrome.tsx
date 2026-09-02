import { business, nav } from "../lib/content";
import { A } from "./link";
import { previewMode } from "../lib/preview";

/**
 * The mark — the real badge, recovered from the site's own PDF export.
 *
 * It was never fetchable: the Wix HTML names it
 * `3f6c3b_122a194aa059428a978250e93b55845a~mv2.png` on static.wixstatic.com,
 * which this environment cannot reach. It came out of the embedded image
 * streams in the PDF instead, at 223×142 with transparency intact.
 *
 * ⚠️ It is a DARK mark — 44% of its opaque pixels are #002040. It reads on
 * teal and on white and would vanish on the ink footer, so dark grounds keep
 * the live-text wordmark until Tristen supplies a knockout version. That is
 * also the more robust choice in email, where an image wordmark disappears
 * entirely when a client blocks images.
 */
function Mark({ onDark = false }: { onDark?: boolean }) {
  if (onDark) {
    return (
      <span className="font-display text-lg font-bold uppercase tracking-tight text-paper">
        Curbology
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/curbology-logo.png"
      alt="Curbology Exterior Services"
      width={82}
      height={52}
      /* Below ~50px the badge's "EXTERIOR SERVICES" bar mushes — it carries a
         lot of fine detail for its size. A vector original would fix that
         properly; this is the largest raster that exists. */
      className="h-11 w-auto md:h-[52px]"
    />
  );
}

export function Nav() {
  return (
    <header className="bg-teal">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-4 md:py-5">
        <div className="flex items-center gap-x-6 gap-y-3">
          <A href="/" className="mr-auto" aria-label={`${business.name} — home`}>
            <Mark />
          </A>

          {/* Click-to-call stays visible at every width. For a local service
              business it is the highest-intent action on the page, and burying
              it behind a menu on the devices most likely to place the call
              would be the wrong economy. */}
          {/* nowrap: without it a formatted number breaks at the hyphen and the
              space, and "(248) 387-9215" stacks into three lines on a phone. */}
          <A
            href={business.phone.href}
            className="whitespace-nowrap font-medium text-ink underline underline-offset-4"
          >
            {business.phone.display}
          </A>

          {/* Desktop: the links inline. */}
          <nav aria-label="Main" className="hidden md:block">
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

          <A href="/contact" className="btn btn--ink hidden md:inline-flex">Get a free quote</A>

          {/*
            Mobile: a <details> disclosure rather than a scripted menu.
            It opens and closes with no JavaScript at all, which matters on the
            devices this audience actually uses — and it meant the header stopped
            eating 430px of an 844px screen before the headline began.
          */}
          <details className="group md:hidden">
            <summary
              className="btn btn--ink list-none [&::-webkit-details-marker]:hidden"
              aria-label="Open menu"
            >
              Menu
            </summary>
            <nav
              aria-label="Main"
              className="absolute inset-x-0 z-50 mt-3 border-y border-ink/15 bg-teal px-6 py-5"
            >
              <ul className="space-y-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <A href={item.href} className="text-lg text-ink">{item.label}</A>
                  </li>
                ))}
              </ul>
              <A href="/contact" className="btn btn--ink mt-5 w-full">Get a free quote</A>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper">
      {/* Extra bottom clearance in preview so the fixed ribbon does not sit on
          top of the legal links. It costs nothing anywhere else. */}
      <div className={`mx-auto w-full max-w-6xl px-6 pt-16 ${previewMode() ? "pb-28" : "pb-16"}`}>
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
