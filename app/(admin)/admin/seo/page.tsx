import type { Metadata } from "next";
import { configured, writable } from "../../../../lib/env";
import { previewMode } from "../../../../lib/preview";
import { listSeo, listRedirects } from "../../../../lib/db";
import {
  AdminHeader, NotConfigured, NotWritable, Card, Pill, Button, Field,
  SaveBanner, fieldCls,
} from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "SEO & Redirects" };

/**
 * Two jobs that always end up on one screen because they are the same job:
 * making sure a URL says the right thing, or points at one that does.
 *
 * An override with an empty title is not an override — the page falls back to
 * what the code sets, which is the sane default and the reason a blank field
 * here is allowed rather than validated against.
 */
export default async function SeoPage({
  searchParams,
}: { searchParams: Promise<{ s?: string; m?: string }> }) {
  const { s, m } = await searchParams;
  if (!configured() && !previewMode()) {
    return <div className="space-y-8"><AdminHeader eyebrow="Marketing" title="SEO & Redirects" /><NotConfigured /></div>;
  }

  const [overrides, redirects] = await Promise.all([listSeo(), listRedirects()]);

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Marketing"
        title="SEO &amp; Redirects"
        intro="Per-page titles and descriptions, and a place to send URLs that no longer exist."
      />
      <SaveBanner state={s} message={m} />
      {!writable() && <NotWritable />}

      <Card title="Page overrides"
        hint="Leave a field empty and the page keeps what the code sets. Titles beyond about 60 characters are cut off in results.">
        <form action="/api/admin/seo" method="post" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
          <Field label="Path" htmlFor="seo-path" >
            <input id="seo-path" name="path" required placeholder="/services/roof-cleaning"
              pattern="/.*" className={fieldCls} />
          </Field>
          <Field label="Title" htmlFor="seo-title">
            <input id="seo-title" name="title" maxLength={70} className={fieldCls} />
          </Field>
          <Button weight="loud">Add</Button>
          <Field label="Description" htmlFor="seo-desc" className="sm:col-span-2">
            <input id="seo-desc" name="description" maxLength={200} className={fieldCls} />
          </Field>
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" name="noindex" value="yes" /> No-index
          </label>
        </form>

        {overrides.length > 0 && (
          <ul className="mt-6 divide-y divide-[color:var(--console-line)] border-t border-[color:var(--console-line)]">
            {overrides.map((o) => (
              <li key={o.path} className="flex flex-wrap items-start gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{o.path}</span>
                  <span className="block text-[color:var(--muted)]">
                    {o.title ?? <em>title unchanged</em>}
                    {o.description && ` — ${o.description}`}
                  </span>
                </span>
                {o.noindex && <Pill tone="warn">no-index</Pill>}
                <form action="/api/admin/seo" method="post">
                  <input type="hidden" name="path" value={o.path} />
                  <input type="hidden" name="remove" value="yes" />
                  <Button>Remove</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Redirects"
        hint="Matched exactly, before the 404. A redirect whose target is itself redirected is refused rather than allowed to loop.">
        <form action="/api/admin/redirect" method="post" className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end">
          <Field label="From" htmlFor="r-from">
            <input id="r-from" name="from" required placeholder="/pressure-washing" pattern="/.*" className={fieldCls} />
          </Field>
          <Field label="To" htmlFor="r-to">
            <input id="r-to" name="to" required placeholder="/services/pressure-washing" className={fieldCls} />
          </Field>
          <label className="flex items-center gap-2 pb-2.5 text-sm">
            <input type="checkbox" name="permanent" value="yes" defaultChecked /> Permanent
          </label>
          <Button weight="loud">Add</Button>
        </form>

        {redirects.length > 0 && (
          <ul className="mt-6 divide-y divide-[color:var(--console-line)] border-t border-[color:var(--console-line)]">
            {redirects.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{r.from_path}</span>
                  <span aria-hidden="true" className="mx-2 text-[color:var(--muted)]">→</span>
                  <span>{r.to_path}</span>
                </span>
                <Pill tone="muted">{r.permanent ? "308" : "307"}</Pill>
                <Pill tone={r.hits ? "accent" : "muted"}>{r.hits} hit{r.hits === 1 ? "" : "s"}</Pill>
                <form action="/api/admin/redirect" method="post">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="remove" value="yes" />
                  <Button>Remove</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
