import type { Metadata } from "next";
import { siteContent } from "../../../lib/cms";
import { A } from "../../../components/link";

export async function generateMetadata(): Promise<Metadata> {
  const { business } = await siteContent();
  return {
    title: business.name,
    description: `Call, text, or get a free quote. Exterior cleaning across ${business.serviceArea.county}, ${business.serviceArea.state}.`,
  };
}

/**
 * The link-in-bio hub. Instagram bio, Google profile, truck decal, yard-sign QR.
 * It will be opened more often than most of the site — on cellular, one-handed,
 * outdoors — so it carries no nav, no hero image, no loader, and no font that
 * blocks paint.
 *
 * Actions are ordered by what the business wants most. Every target is 44px.
 *
 * Social icons are absent: all six on the live site pointed at platform
 * homepages rather than Curbology profiles. They return when Tristen supplies
 * real URLs — `business.socials` already drives this list.
 */

export default async function HubPage() {
  const { business, pages } = await siteContent();
  const actions: { label: string; href: string; sub: string; primary?: boolean }[] = [
    { label: pages.hub.actions.call, href: business.phone.href, sub: business.phone.display, primary: true },
    { label: pages.hub.text.label, href: `sms:${business.phone.href.replace("tel:", "")}`, sub: pages.hub.text.sub },
    { label: pages.hub.actions.quote.label, href: "/quote", sub: pages.hub.actions.quote.sub },
    { label: pages.hub.actions.review.label, href: "/review", sub: pages.hub.actions.review.sub },
    { label: pages.hub.actions.work.label, href: "/gallery", sub: pages.hub.actions.work.sub },
  ];
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">{business.name}</h1>
        <p className="mt-2 text-[color:var(--muted)]">
          {pages.hub.pressureWashingSoftWashing}
        </p>
      </div>

      <ul className="mt-10 space-y-3">
        {actions.map((a) => (
          <li key={a.href}>
            <A
              href={a.href}
              className={`btn !min-h-[64px] !justify-start !rounded-2xl !px-5 flex-col !items-start ${
                a.primary ? "btn--ink" : "btn--paper"
              }`}
            >
              <span className="font-medium">{a.label}</span>
              <span className={`text-sm ${a.primary ? "text-white/70" : "text-[color:var(--muted)]"}`}>
                {a.sub}
              </span>
            </A>
          </li>
        ))}
      </ul>

      {business.socials.length > 0 && (
        <ul className="mt-8 flex justify-center gap-5">
          {business.socials.map((s) => (
            <li key={s.platform}>
              <A href={s.href} className="text-[color:var(--muted)] hover:text-ink">{s.platform}</A>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-sm text-[color:var(--muted)]">
        {business.serviceArea.county}, {business.serviceArea.state}
      </p>
    </div>
  );
}
