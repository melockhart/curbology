import type { Metadata } from "next";
import { currentUser } from "../../lib/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function SignIn({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="ground-paper flex min-h-screen items-center justify-center bg-[#f6f7f9] px-6">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/curbology-logo.png" alt="Curbology Exterior Services" className="mb-8 h-12 w-auto" />
        <h1 className="font-display text-2xl font-bold">Console</h1>

        <form action="/api/sign-in" method="post" className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" required autoComplete="username"
              className="mt-1 min-h-[42px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password"
              className="mt-1 min-h-[42px] w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
          </div>
          {error && (
            <p role="alert" className="text-sm text-[color:var(--muted)]">
              {/* The same message whether the address is unknown, not on the
                  allowlist, or the password is wrong. Which of those it was is
                  not something to tell someone who is not getting in. */}
              {decodeURIComponent(error)}
            </p>
          )}
          <button className="min-h-[42px] w-full rounded-lg bg-ink px-5 text-paper hover:bg-slate">Sign in</button>
        </form>
      </div>
    </div>
  );
}
