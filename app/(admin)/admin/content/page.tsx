import type { Metadata } from "next";
import { requireUser } from "../../../../lib/guard";
import { configured } from "../../../../lib/env";
import { contentBlocks } from "../../../../lib/db";
import { AdminShell, NotConfigured } from "../../../../components/admin";

export const metadata: Metadata = { title: "Content", robots: { index: false, follow: false } };

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
type Field = { key: string; label: string; type: "text" | "textarea"; hint?: string };

const FIELDS: Field[] = [
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

export default async function ContentPage() {
  const user = await requireUser();
  if (!configured()) return <AdminShell title="Content" user={user}><NotConfigured /></AdminShell>;

  const blocks = await contentBlocks();
  const value = (key: string) => {
    const v = blocks[key];
    return typeof v === "string" ? v : v == null ? "" : JSON.stringify(v);
  };

  return (
    <AdminShell
      title="Content"
      intro="Changes go live immediately. Everything else about the site lives in the code."
      user={user}
    >
      <form action="/api/admin/content" method="post" className="max-w-2xl space-y-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="rounded-xl border border-ink/10 bg-paper p-5">
            <label htmlFor={f.key} className="block font-medium">{f.label}</label>
            {f.hint && (
              <p id={`${f.key}-hint`} className="mt-1 text-sm text-[color:var(--muted)]">{f.hint}</p>
            )}
            {f.type === "textarea" ? (
              <textarea
                id={f.key} name={f.key} rows={3} defaultValue={value(f.key)}
                aria-describedby={f.hint ? `${f.key}-hint` : undefined}
                className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
              />
            ) : (
              <input
                id={f.key} name={f.key} type="text" defaultValue={value(f.key)}
                aria-describedby={f.hint ? `${f.key}-hint` : undefined}
                className="mt-2 min-h-[42px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
              />
            )}
          </div>
        ))}
        <button className="min-h-[42px] rounded-lg bg-ink px-5 text-paper hover:bg-slate">Save changes</button>
      </form>
    </AdminShell>
  );
}
