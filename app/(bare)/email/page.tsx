import type { Metadata } from "next";
import { A } from "../../../components/link";

export const metadata: Metadata = {
  title: "Email shells",
  robots: { index: false, follow: false },
};

/**
 * The index every screen is linked from. A real page rather than a generated
 * index.html, because /email would otherwise 404 — only /email/index.html
 * resolved, which is not a URL anyone would type or paste into a contract.
 */
const artifacts = [
  ["transactional-preview", "Transactional — a booking confirmation, rendered end to end"],
  ["transactional-well", "Transactional — The Well, the blank"],
  ["client-preview", "Client — a quote, rendered end to end"],
  ["client-well", "Client — The Well, the blank"],
  ["team-preview", "Team — an ops rollup"],
  ["team-well", "Team — The Well, the blank"],
  ["compose", "The composable blank"],
  ["elements", "The palette — every element beside the call that produces it"],
];

export default function EmailIndex() {
  return (
    <div className="ground-paper mx-auto max-w-2xl px-6 py-16">
      <h1 className="display-lg">Curbology email shells</h1>

      <p className="mt-6 text-lg">
        Three shells, split by what a message <em>is</em> rather than only who
        receives it.
      </p>

      <dl className="mt-8 space-y-4">
        <div>
          <dt className="font-medium">transactional</dt>
          <dd className="text-[color:var(--muted)]">
            External but not commercial — quote replies, confirmations, job
            notices. Lockup, no postal address, no opt-out.
          </dd>
        </div>
        <div>
          <dt className="font-medium">client</dt>
          <dd className="text-[color:var(--muted)]">
            External and commercial. Lockup, postal address, exactly one opt-out.
          </dd>
        </div>
        <div>
          <dt className="font-medium">team</dt>
          <dd className="text-[color:var(--muted)]">
            Internal. Names the sending agent, tabular well, neither of the above.
          </dd>
        </div>
      </dl>

      <div className="mt-8 rounded-xl border-2 border-dashed border-current/30 p-5">
        <p>
          <strong>The client shell currently refuses to render.</strong> Curbology
          has no valid physical postal address, and CAN-SPAM requires one in every
          commercial email. That is deliberate — refusing is the feature. Most of
          what this site sends is transactional and exempt, so it ships today.
        </p>
      </div>

      <ul className="mt-10 space-y-2">
        {artifacts.map(([slug, label]) => (
          <li key={slug}>
            <A href={`/email/${slug}`} className="underline underline-offset-4">{slug}</A>
            <span className="text-[color:var(--muted)]"> — {label}</span>
          </li>
        ))}
        <li className="pt-3">
          <A href="/email/agent.txt" className="underline underline-offset-4">agent.txt</A>
          <span className="text-[color:var(--muted)]"> — the contract. One URL, self-contained.</span>
        </li>
      </ul>
    </div>
  );
}
