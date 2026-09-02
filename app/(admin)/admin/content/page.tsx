import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { contentBlocks } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Card, Button, Field, SaveBanner, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Content" };

/**
 * Typed fields over `content_blocks` — not a page builder.
 *
 * Every field here renders somewhere visible. A general-purpose CMS on a
 * four-service site is scope that does not get used and does break the design,
 * so the editable surface is exactly what a service business actually changes:
 * what it charges, when it works, where it goes, and the line at the top.
 *
 * Anything that would need judgment about layout stays in the repo.
 */
type ContentField = { key: string; label: string; type: "text" | "textarea"; hint?: string };

const FIELDS: ContentField[] = [
  { key: "home.heroHeading", label: "Homepage headline", type: "text",
    hint: "Runs at display scale. Around eight words is the most that reads well." },
  { key: "home.heroBody", label: "Homepage sub-paragraph", type: "textarea" },
  { key: "business.hours", label: "Hours", type: "text",
    hint: "Shown on contact and in the footer. Leave blank rather than guessing." },
  { key: "business.serviceTowns", label: "Towns served", type: "textarea",
    hint: "One per line. These are what local search reads, so use real names." },
  { key: "pricing.note", label: "Pricing note", type: "textarea",
    hint: "Only published if you fill it in. A made-up range is a quote you have to honour." },
];

export default async function ContentPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Content" title="Content" /><NotConfigured /></div>;
  }

  const blocks = await contentBlocks();
  const value = (key: string) => {
    const v = blocks[key];
    return typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Content"
        title="Content"
        intro="Changes go live immediately. Everything else about the site lives in the code."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <form action="/api/admin/content" method="post" className="max-w-2xl space-y-4">
        {FIELDS.map((f) => (
          <Card key={f.key}>
            <Field label={f.label} hint={f.hint} htmlFor={f.key}>
              {f.type === "textarea" ? (
                <textarea id={f.key} name={f.key} rows={3} defaultValue={value(f.key)}
                  className={fieldCls} />
              ) : (
                <input id={f.key} name={f.key} type="text" defaultValue={value(f.key)}
                  className={fieldCls} />
              )}
            </Field>
          </Card>
        ))}
        <Button weight="loud">Save changes</Button>
      </form>
    </div>
  );
}
