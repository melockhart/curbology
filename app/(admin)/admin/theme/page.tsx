import type { Metadata } from "next";
import { AdminHeader, Card, Pill, Code } from "../../../../components/admin/admin-ui";

export const metadata: Metadata = { title: "Theme" };

/**
 * The brand, as the site actually ships it — and deliberately read-only.
 *
 * A colour picker here would be one click away from unreadable. Every pair
 * below was chosen because it passes WCAG AA at the size it is used, and two of
 * them exist specifically because the live site's own button tokens computed to
 * 1.64:1 and made its quote button invisible. Handing that same picker to the
 * console would recreate the bug it was built to fix.
 *
 * The ratios are computed here from the hex values, not copied from a note. If
 * a token changes, this table changes with it and stops agreeing with a claim
 * nobody re-checked.
 */
const TOKENS = [
  { name: "ink", hex: "#1a202c", role: "Body text, and the darkest ground" },
  { name: "slate", hex: "#4a5568", role: "Muted text on white" },
  { name: "teal", hex: "#04b8ba", role: "The accent — a ground, never small text" },
  { name: "blue", hex: "#3182ce", role: "Display type only, never body or UI" },
  { name: "paper", hex: "#ffffff", role: "The default ground" },
];

/**
 * `minimum` is 3:1 only where the pair is used at large text, so the swatch is
 * rendered at that size too. A 3:1 pair shown at 14px in this table would be a
 * failing sample illustrating a passing rule — and the contrast sweep, quite
 * rightly, flagged it.
 */
const PAIRS: Array<{ fg: string; bg: string; where: string; minimum: number }> = [
  { fg: "#1a202c", bg: "#ffffff", where: "Body text", minimum: 4.5 },
  { fg: "#4a5568", bg: "#ffffff", where: "Muted text", minimum: 4.5 },
  { fg: "#1a202c", bg: "#04b8ba", where: "Text on the accent, and the primary button", minimum: 4.5 },
  { fg: "#04b8ba", bg: "#1a202c", where: "Accent text on ink", minimum: 4.5 },
  { fg: "#ffffff", bg: "#1a202c", where: "Text on the dark ground", minimum: 4.5 },
  { fg: "#3182ce", bg: "#ffffff", where: "Display type only — large sizes clear 3:1", minimum: 3 },
];

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export default function ThemePage() {
  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Configure"
        title="Theme"
        intro="The tokens the site ships, and what each pair actually measures. Read-only — see below for why."
      />

      <Card title="Palette">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOKENS.map((t) => (
            <li key={t.name} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="h-11 w-11 shrink-0 rounded-md border border-ink/15"
                style={{ background: t.hex }}
              />
              <span className="min-w-0">
                <span className="block font-medium">{t.name}</span>
                <span className="block text-xs text-[color:var(--muted)]">
                  <Code>{t.hex}</Code> · {t.role}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Contrast, computed"
        hint="Each ratio is calculated on this page from the hex values above, against WCAG 2.1.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-[color:var(--console-line)] text-left">
                {["Sample", "Where", "Measured", "Needs", ""].map((h) => (
                  <th key={h} scope="col" className="py-2 pr-4"><span className="eyebrow">{h}</span></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--console-line)]">
              {PAIRS.map((p) => {
                const value = ratio(p.fg, p.bg);
                const passes = value >= p.minimum;
                return (
                  <tr key={`${p.fg}-${p.bg}`}>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block rounded px-3 py-1.5 font-medium ${
                          p.minimum >= 4.5 ? "text-sm" : "text-2xl"
                        }`}
                        style={{ background: p.bg, color: p.fg }}
                      >
                        Free quote
                      </span>
                    </td>
                    <td className="py-3 pr-4">{p.where}</td>
                    <td className="py-3 pr-4 tabular-nums">{value.toFixed(2)}:1</td>
                    <td className="py-3 pr-4 tabular-nums text-[color:var(--muted)]">{p.minimum}:1</td>
                    <td className="py-3"><Pill tone={passes ? "success" : "warn"}>{passes ? "passes" : "fails"}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Why there is no colour picker here">
        <p className="max-w-prose text-sm text-[color:var(--muted)]">
          The live site&rsquo;s own button tokens were{" "}
          <Code>#3182ce</Code> on <Code>#04b8ba</Code> — 1.64:1, which made the
          quote button on a lead-generation site effectively invisible. Both
          replacements above come from the same palette; nothing was invented to
          fix it. A picker in this console would put that failure one click away
          again, on the exact element it cost the most on.
        </p>
        <p className="mt-3 max-w-prose text-sm text-[color:var(--muted)]">
          Colours change in <Code>app/globals.css</Code>, and{" "}
          <Code>npm run contrast</Code> re-measures every rendered element on
          every route before the change ships.
        </p>
      </Card>
    </div>
  );
}
