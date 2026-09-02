import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { business, quoteForm, services } from "../../../lib/content";
import { Section, Eyebrow } from "../../../components/ui";
import { A } from "../../../components/link";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/contact", { title: "Get a free quote" });
}

/**
 * One form, not the live site's two. Photo upload included — it is the highest-
 * value field on a quote form for this trade, because it lets Tristen price the
 * job without driving out.
 *
 * Posts to /api/leads. The endpoint validates and sets status/timestamps itself;
 * the browser never writes to Supabase directly, or anyone could set their own
 * lead status.
 */
export default function ContactPage() {
  const f = quoteForm.fields;
  return (
    <Section>
      <div className="grid gap-14 md:grid-cols-2">
        <div>
          <Eyebrow>Free quote</Eyebrow>
          <h1 className="text-5xl">Tell us about the job</h1>
          <p className="mt-6 text-lg text-slate">
            Send a few details and a photo or two. Most of the time that is enough
            to give you a real number without visiting.
          </p>
          <p className="mt-8">
            Prefer to talk?{" "}
            <A href={business.phone.href} className="font-medium underline underline-offset-4">
              {business.phone.display}
            </A>
          </p>
          <p className="mt-2 text-slate">
            Serving {business.serviceArea.county}, {business.serviceArea.state}.
          </p>
        </div>

        <form action="/api/leads" method="post" encType="multipart/form-data" className="space-y-5">
          <Field name="name" label={f.name} required autoComplete="name" />
          <Field name="email" label={f.email} type="email" required autoComplete="email" />
          <Field name="phone" label={f.phone} type="tel" required autoComplete="tel" />
          <Field name="address" label={f.address} required autoComplete="street-address" />

          <div>
            <label htmlFor="service" className="block font-medium">
              {f.service} <Req />
            </label>
            <select
              id="service" name="service" required
              className="mt-2 min-h-[44px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
              <option value="not-sure">Not sure — help me choose</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block font-medium">{f.message}</label>
            <textarea
              id="message" name="message" rows={4}
              placeholder={quoteForm.messagePlaceholder}
              className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="photos" className="block font-medium">{f.photos}</label>
            <p id="photos-hint" className="mt-1 text-sm text-slate">{quoteForm.photosHint}</p>
            <input
              id="photos" name="photos" type="file" accept="image/*" multiple
              aria-describedby="photos-hint"
              className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
            />
          </div>

          {/* ink on white — 16.32:1. The live site's submit button was 1.64:1. */}
          <button type="submit" className="btn btn--ink w-full">
            {quoteForm.submit}
          </button>
        </form>
      </div>
    </Section>
  );
}

function Req() {
  return <span className="text-slate" aria-hidden="true">*</span>;
}

function Field({
  name, label, type = "text", required = false, autoComplete,
}: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block font-medium">
        {label} {required && <Req />}
      </label>
      <input
        id={name} name={name} type={type} required={required} autoComplete={autoComplete}
        className="mt-2 min-h-[44px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2"
      />
    </div>
  );
}
