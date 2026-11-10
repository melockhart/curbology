import type { Metadata } from "next";
import { currentUser } from "../../lib/session";
import { redirect } from "next/navigation";
import { previewMode, previewPassword } from "../../lib/preview";
import { A } from "../../components/link";
import { safePath } from "../../lib/safe-path";
import "@fontsource-variable/archivo/wdth.css";
import "../../components/admin/console.css";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

const field =
  "mt-1.5 min-h-[44px] w-full rounded-[12px] border border-[#8796a8] bg-white px-3 py-2 text-[#0c2448] focus-visible:border-[#0c2448] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1890d0]";

/** The approved sign-in screen: navy brand panel beside the form, stacked on a phone. */
export default async function SignIn({
  searchParams,
}: { searchParams: Promise<{ error?: string; redirect?: string }> }) {
  const { error, redirect: requested } = await searchParams;
  const back = safePath(requested);
  if (await currentUser()) redirect(back);

  return (
    <div className="si">
      <section className="si-brand">
        <span className="cx-mark si-mark">
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo, as on the site */}
          <img src="/v2/logo.png" alt="Curbology" />
        </span>
        <div className="si-line">
          <p className="si-big">Quotes, messages and reviews, in one place.</p>
          <p className="si-small">For Curbology&apos;s team only.</p>
        </div>
      </section>
      <main className="si-side">
        <div className="si-card">
          <h1 className="si-h1">Sign in</h1>
          <p className="mt-1 text-sm text-[#3d5070]">Use your Opscend login.</p>
          {previewMode() && (
            <p className="mt-4 rounded-[12px] border border-[#d3dbe3] bg-[#e8f3fa] px-3 py-2 text-sm">
              {previewPassword() ? (
                <>Preview. Any email, plus the preview password. <A href="/preview" className="underline underline-offset-4">Every screen</A>.</>
              ) : (
                <>Preview, and the console is closed: no preview password is set here. The rest of the build is at{" "}
                  <A href="/preview" className="underline underline-offset-4">/preview</A>.</>
              )}
            </p>
          )}
          <form action="/api/sign-in" method="post" className="mt-5 space-y-4">
            <input type="hidden" name="redirect" value={back} />
            <div>
              <label htmlFor="email" className="block text-sm font-semibold">Email</label>
              <input id="email" name="email" type="email" required autoComplete="username" className={field} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold">Password</label>
              <input id="password" name="password" type="password" required autoComplete="current-password" className={field} />
            </div>
            <button className="min-h-[46px] w-full rounded-[12px] bg-[#0c2448] px-5 text-[15px] font-semibold text-white hover:bg-[#163a6d]">Sign in</button>
            {error && (
              <p role="alert" className="text-sm font-semibold text-[#a32f2f]">
                {/* One message whether the address is unknown, not allowed, or the password is wrong. */}
                {decodeURIComponent(error)}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
