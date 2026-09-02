import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { siteSettings } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Card, Button, Field, SaveBanner, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Settings" };

/**
 * Switches, as opposed to copy — Content is next door for the words.
 *
 * Every setting on this page is read by something. Nothing here is a
 * placeholder for a feature that does not exist yet: a switch that changes
 * nothing is worse than no switch, because it is indistinguishable from one
 * that is broken.
 */
export default async function SettingsPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Configure" title="Settings" /><NotConfigured /></div>;
  }

  const settings = await siteSettings();
  const text = (k: string) => (typeof settings[k] === "string" ? (settings[k] as string) : "");
  const on = (k: string, fallback = true) =>
    typeof settings[k] === "boolean" ? (settings[k] as boolean) : fallback;

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Settings"
        intro="Four switches, each one read by a page. Saving takes effect on the next request."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <form action="/api/admin/settings" method="post" className="max-w-2xl space-y-4">
        <Card title="Site banner" hint="Appears above the header on every public page. Empty means no banner.">
          <Field label="Message" htmlFor="site.banner">
            <input id="site.banner" name="site.banner" type="text" maxLength={140}
              defaultValue={text("site.banner")} className={fieldCls}
              placeholder="Booked into November — quotes still open" />
          </Field>
        </Card>

        <Card title="Google reviews"
          hint="Shown to everyone who leaves a review, whatever they rated. Routing people by their rating is unlawful, so this link is offered identically or not at all.">
          <Field label="Google review link" htmlFor="reviews.googleUrl">
            <input id="reviews.googleUrl" name="reviews.googleUrl" type="url"
              defaultValue={text("reviews.googleUrl")} className={fieldCls}
              placeholder="https://g.page/r/…/review" />
          </Field>
        </Card>

        <Card title="Portals" hint="Closing one leaves the page up and explains it, rather than 404ing a link that is already in someone's inbox.">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="portal.reviewOpen" value="yes" defaultChecked={on("portal.reviewOpen")} />
            Review portal is open
          </label>
          <label className="mt-3 flex items-center gap-3 text-sm">
            <input type="checkbox" name="portal.testimonialOpen" value="yes" defaultChecked={on("portal.testimonialOpen")} />
            Testimonial booking is open
          </label>
        </Card>

        <Button weight="loud">Save settings</Button>
      </form>
    </div>
  );
}
