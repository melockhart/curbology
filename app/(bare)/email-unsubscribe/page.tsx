import type { Metadata } from "next";
import { PortalShell, Submit, SubmitNotice, type SubmitState } from "../../../components/portal";
import { A } from "../../../components/link";
import { siteContent } from "../../../lib/cms";

export const metadata: Metadata = {
  title: "Unsubscribe",
  // Scanners and inbox previews should not index or follow this.
  robots: { index: false, follow: false },
};

/**
 * ⛔ THE RULE THIS PAGE EXISTS TO OBEY: suppression NEVER runs on render.
 *
 * Email security scanners fetch every URL in a message before it reaches the
 * inbox. A page that unsubscribes on GET therefore opts out people who never
 * clicked anything — silently, and at exactly the moment the campaign looks
 * like it is working.
 *
 * So this page is a *server component that writes nothing*. It renders a form.
 * The suppression happens in POST /api/unsubscribe and nowhere else. Keep it
 * that way: the moment someone moves the write into this file to "save a click",
 * the list starts eroding invisibly.
 *
 * `/unsubscribe` and `/email-opt-out` are permanent aliases (see next.config.ts).
 * Never point a Curbology email at another property's opt-out.
 */
export default async function UnsubscribePage({
  searchParams,
}: { searchParams: Promise<{ id?: string; done?: string }> }) {
  const { business, pages } = await siteContent();
  const { id, done } = await searchParams;

  // Done means done. Showing the form again after a successful opt-out invites
  // a second press, and a second press that looks like it failed is how a
  // spam complaint starts.
  if (done === "ok" || done === "preview") {
    return (
      <PortalShell
        title={pages.unsubscribe.youAreUnsubscribed}
        intro={pages.unsubscribe.weWillNotEmail}
      >
        <SubmitNotice state={done as SubmitState} />
        <p className="mt-8">
          <A href="/" className="underline underline-offset-4">{pages.unsubscribe.backToTheSite}</A>
        </p>
      </PortalShell>
    );
  }

  if (!id) {
    return (
      <PortalShell
        title={pages.unsubscribe.weNeedTheLink}
        intro={pages.unsubscribe.thisPageNeedsThe}
      >
        <p>
          {pages.unsubscribe.openTheEmailAgain}{" "}
          <A href="/contact" className="underline underline-offset-4">{pages.unsubscribe.askUsToRemove}</A>{" "}
          {pages.unsubscribe.andWeWillDo}
        </p>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      title={pages.unsubscribe.unsubscribeFromOurEmails}
      intro={pages.unsubscribe.oneClickAndWe}
    >
      <SubmitNotice state={done as SubmitState} />
      <form action="/api/unsubscribe" method="post" className="space-y-6">
        <input type="hidden" name="id" value={id} />

        <div>
          <label htmlFor="reason" className="block font-medium">
            {pages.unsubscribe.anythingWeGotWrong}{" "}<span className="text-[color:var(--muted)]">{pages.unsubscribe.optional}</span>
          </label>
          <textarea id="reason" name="reason" rows={3}
            className="mt-2 w-full rounded-lg border border-ink/25 bg-paper px-3 py-2" />
        </div>

        <Submit>{pages.unsubscribe.unsubscribeMe}</Submit>
      </form>

      <p className="mt-8 text-sm text-[color:var(--muted)]">
        {pages.unsubscribe.changedYourMindJust}{" "}
        <A href={business.phone.href} className="underline underline-offset-4">
          {business.phone.display}
        </A>
        .
      </p>
    </PortalShell>
  );
}
