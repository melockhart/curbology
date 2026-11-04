import type { CSSProperties } from "react";
import { business, nav, services } from "../lib/content";
import { HeaderBehaviour } from "./motion/header";
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
      /* Height comes from --mark-h so the bar can resize the mark by flipping
         one attribute. See .bar-mark in globals.css for the legibility trade
         the slim bar makes here. */
      className="bar-mark"
    />
  );
}

export function Nav() {
  return (
    <header
      id="site-header"
      className="glass ground-paper"
      data-stuck="false"
    >
      <div className="bar-row relative z-[2] mx-auto flex w-full max-w-[1600px] items-center px-4 md:px-5">
        {/* flex, not inline: an inline <img> sits on a baseline and drags the
            row's height up by its descender space — 2px at rest, and the bar is
            budgeted to the pixel. */}
        <A href="/" className="relative z-[3] flex shrink-0" aria-label={`${business.name} — home`}>
          <Mark />
        </A>

        {/*
          The section links, inline, from lg up.

          They are not a replacement for the menu — the overlay stays at every
          width, so this is a shortcut to the five places people go most, not
          the navigation itself. That is why the list here is `nav` and the
          overlay carries `nav` plus the services plus the conversion column:
          the bar is the fast path, the overlay is the index.

          Below lg the row cannot hold five links, the phone number and two
          controls without wrapping, and the number does not get shortened to
          make room for a link that is one tap away in the menu.
        */}
        <nav
          aria-label="Sections"
          className="relative z-[3] ml-7 hidden items-center gap-x-6 lg:flex"
        >
          {nav.map((item) => (
            <A key={item.href} href={item.href} className="bar-link">
              {item.label}
            </A>
          ))}
        </nav>

        <div className="relative z-[3] ml-auto flex items-center gap-x-4 md:gap-x-5">
          {/* Click-to-call stays out of the menu at every width. For a local
              service business it is the highest-intent action on the page, and
              putting it one tap further away on the devices most likely to
              place the call would be the wrong economy. */}
          {/* nowrap: without it a formatted number breaks at the hyphen and the
              space, and "(248) 387-9215" stacks into three lines on a phone. */}
          <A
            href={business.phone.href}
            className="bar-ink whitespace-nowrap text-sm font-medium underline underline-offset-4 md:text-[0.9375rem]"
          >
            {business.phone.display}
          </A>

          <A href="/quote" className="btn btn--ink btn--bar hidden sm:inline-flex">
            Get a free quote
          </A>

          {/*
            The full-screen overlay menu — the third of the four locked
            hard-blocks, and kept at every width even now that the links are
            inline. Two ways to navigate rather than a control that changes
            meaning at a breakpoint: on a laptop it is the index, on a phone it
            is the navigation.

            <details> rather than a scripted disclosure: it opens and closes
            with no JavaScript, and the open animation is a CSS keyframe that
            runs when the panel is displayed. The site's no-JS behaviour was
            verified and this keeps it.
          */}
          {/* flex: the summary is an inline-flex .btn, and inside a block <details>
              that makes a line box whose descender space adds a few pixels to
              the bar. Same reason the mark's anchor is flex. */}
          <details className="group menu relative z-[2] flex" name="site-menu">
            <summary
              className="btn btn--ink btn--bar relative z-[3] list-none [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true" className="grid gap-[3px]">
                  <span className="block h-[2px] w-4 bg-current transition-transform duration-200 group-open:translate-y-[5px] group-open:rotate-45" />
                  <span className="block h-[2px] w-4 bg-current transition-opacity duration-200 group-open:opacity-0" />
                  <span className="block h-[2px] w-4 bg-current transition-transform duration-200 group-open:-translate-y-[5px] group-open:-rotate-45" />
                </span>
                <span className="group-open:hidden">Menu</span>
                <span className="hidden group-open:inline">Close</span>
              </span>
            </summary>

            <nav
              aria-label="All pages"
              /* Extra bottom clearance in preview, for the same reason the
                 footer has it: the fixed ribbon otherwise sits on top of the
                 phone number at the end of the menu on a phone. */
              className={`menu-overlay ground-deep fixed inset-x-0 bottom-0 z-[1] flex flex-col overflow-y-auto bg-teal-900 px-6 pt-10 ${previewMode() ? "pb-24" : "pb-10"}`}
              /* Starts below the floating bar rather than under it, so the bar
                 keeps its own glass ground and its ink stays ink. */
              style={{ top: "var(--bar-space)" }}
            >
              {/* items-center, not items-end. With three columns of very
                  different heights, bottom-aligning them parks the whole menu
                  in the lower third and leaves a dead half-screen of teal
                  above — the exact blank space this design spent a round
                  removing from the page. */}
              <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center gap-y-12 lg:flex-row lg:items-center lg:justify-between lg:gap-x-16">
                <ul className="w-full max-w-2xl">
                  {nav.map((item, i) => (
                    <li key={item.href} data-row style={{ "--i": i } as CSSProperties}>
                      <A
                        href={item.href}
                        className="menu-link block border-b py-4 font-display font-black leading-[0.95] text-stone-050"
                        style={{ borderColor: "var(--rule)", fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
                      >
                        {item.label}
                      </A>
                    </li>
                  ))}
                </ul>

                {/*
                  The services, spelled out. With the top-level sections now in
                  the bar, an overlay that only repeated them would be a second
                  copy of the same five words. This is the part the bar cannot
                  carry: what the business actually sells, one link each.
                */}
                <div
                  data-row
                  style={{ "--i": nav.length } as CSSProperties}
                  className="shrink-0 lg:pb-4"
                >
                  <h2 className="font-spec text-xs uppercase tracking-[0.22em] text-stone-400">
                    Services
                  </h2>
                  <ul className="mt-4 space-y-2.5">
                    {services.map((service) => (
                      <li key={service.slug}>
                        <A
                          href={`/services/${service.slug}`}
                          className="text-base text-stone-050 underline-offset-4 hover:underline md:text-lg"
                        >
                          {service.name}
                        </A>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  data-row
                  style={{ "--i": nav.length + 1 } as CSSProperties}
                  className="flex shrink-0 flex-col items-start gap-5 lg:pb-4"
                >
                  <p className="font-spec text-xs uppercase tracking-[0.22em] text-stone-400">
                    Straight to it
                  </p>
                  <A href="/quote" className="btn btn--paper">Get a free quote</A>
                  <A
                    href={business.phone.href}
                    className="whitespace-nowrap font-display text-3xl font-bold text-teal-300 underline underline-offset-8"
                  >
                    {business.phone.display}
                  </A>
                  <p className="max-w-[18rem] text-sm text-[color:var(--muted)]">
                    Exterior cleaning across {business.serviceArea.county},{" "}
                    {business.serviceArea.stateAbbr}.
                  </p>
                </div>
              </div>
            </nav>
          </details>
        </div>
      </div>
      <HeaderBehaviour />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer ground-ink bg-ink text-stone-050">
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
