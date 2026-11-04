import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { previewMode, previewPassword } from "../../../lib/preview";
import { siteContent } from "../../../lib/cms";
import { NAV_GROUPS } from "../../../lib/admin/nav-config";
import { A } from "../../../components/link";

export const metadata: Metadata = {
  title: "Preview — every screen",
  robots: { index: false, follow: false },
};

/**
 * One page that reaches every screen in the build.
 *
 * Walking a site by clicking through it misses the surfaces that are only ever
 * reached from an email, a QR code or a redirect — which on this build is a
 * third of what was made. This exists so a review covers all of it, and so a
 * link can be handed over without a list of URLs attached.
 *
 * It 404s outside preview mode. It is scaffolding, not a page of the site.
 */
export default async function PreviewIndex() {
  const { services } = await siteContent();
  if (!previewMode()) notFound();
  const consoleOpen = Boolean(previewPassword());

  const groups: Array<{ title: string; note?: string; links: Array<[string, string, string?]> }> = [
    {
      title: "The site",
      note: "Everything under the nav.",
      links: [
        ["/", "Home", "Open hero, before/after slider, the pinned method"],
        ["/services", "Services", "The four the business actually sells"],
        ...services.map((s) => [`/services/${s.slug}`, s.name, "Its own page, its own copy"] as [string, string, string]),
        ["/about", "About", "Built from the homepage's own about copy — no invented history"],
        ["/gallery", "Our work", "Honest empty states until there are real photographs"],
        ["/reviews", "Reviews", "Only what has been published from the console"],
        ["/service-area", "Service area", "Oakland County, and the towns named on the live site"],
        ["/faq", "Questions & pricing", "Answers drawn only from what the live site states"],
        ["/quote", "Get your price", "Address, size, photos, contact, then a price or Tristen"],
        ["/contact", "Get a free quote", "One form, with photo upload"],
      ],
    },
    {
      title: "Reached from somewhere else",
      note: "A QR code, an email footer, an old link. None of these is in the nav, and each is a page someone lands on cold.",
      links: [
        ["/hub", "Link-in-bio hub", "Instagram bio, truck decal, yard-sign QR"],
        ["/review", "Review portal", "Every rating takes the same path"],
        ["/testimonial", "Testimonial booking", "Request → confirm → record → received"],
        ["/email-unsubscribe?id=demo", "Unsubscribe", "POST only — rendering it never suppresses"],
        ["/pressure-washing", "A redirect", "308s to /services/pressure-washing"],
        ["/this-page-does-not-exist", "404", "The one page nobody designs and everybody sees"],
      ],
    },
    {
      title: "Email",
      note: "Rendered HTML, not screenshots. Three shells split by what a message is.",
      links: [["/email", "The shells", "Client · transactional · team, plus the element palette"]],
    },
  ];

  return (
    <div className="ground-paper mx-auto max-w-3xl px-6 py-16">
      <p className="eyebrow">Curbology · preview</p>
      <h1 className="display-lg mt-2">Every screen</h1>
      <p className="mt-6 max-w-prose text-lg text-[color:var(--muted)]">
        The whole build, connected and clickable. There is no database behind it
        yet: the rows in the console are <strong className="text-ink">sample data</strong>,
        not Curbology&rsquo;s customers, and every Save reports honestly that
        nothing was written.
      </p>

      {groups.map((group) => (
        <section key={group.title} className="mt-12">
          <h2 className="font-display text-2xl font-bold">{group.title}</h2>
          {group.note && <p className="mt-2 max-w-prose text-[color:var(--muted)]">{group.note}</p>}
          <ul className="mt-5 divide-y divide-ink/10 rounded-xl border border-ink/10">
            {group.links.map(([href, label, note]) => (
              <li key={href}>
                <A href={href} className="flex items-baseline gap-4 px-5 py-3.5 hover:bg-ink/[0.03]">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{label}</span>
                    {note && <span className="block text-sm text-[color:var(--muted)]">{note}</span>}
                  </span>
                  <code className="hidden shrink-0 text-xs text-[color:var(--muted)] sm:block">{href}</code>
                </A>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">The console</h2>
        <p className="mt-2 max-w-prose text-[color:var(--muted)]">
          {consoleOpen ? (
            <>
              Sign in with any address and the preview password. Sixteen screens,
              all reading the same sample rows.
            </>
          ) : (
            <>
              Closed — <code className="rounded bg-ink/5 px-1">PREVIEW_PASSWORD</code> is
              not set on this deployment, so the console has no door.
            </>
          )}
        </p>
        <p className="mt-4">
          <A href="/sign-in" className="btn btn--ink">
            {consoleOpen ? "Open the console" : "Sign in"}
          </A>
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
            <li key={item.to} className="flex items-baseline gap-3 text-sm">
              <A href={item.to} className="underline underline-offset-4">{item.label}</A>
              {item.hint && <span className="truncate text-[color:var(--muted)]">{item.hint}</span>}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 border-t border-ink/10 pt-6 text-sm text-[color:var(--muted)]">
        Still to come, and blocked on Tristen rather than on code: real
        photography and footage, a confirmed phone number, an address for the
        commercial email lane, a vector logo, and the Google review link. Every
        one of those has an honest empty state in the build right now — none of
        them is filled with a placeholder pretending to be the real thing.
      </p>
    </div>
  );
}
