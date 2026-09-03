import { MotionStage } from "../components/motion/stage";
import { PreviewRibbon } from "../components/preview-ribbon";
import { siteMetadata } from "../lib/document";
// Self-hosted rather than a fonts.googleapis.com <link>: no third-party request,
// nothing render-blocking, and it works in a sandbox with no egress.
// The FULL axis file, not the default import. The default ships wght only, and
// SOFT/WONK set against it do nothing at all — silently, which is the worst way
// for a type direction to fail. 121KB vs 36KB on the display face; the axes are
// the direction.
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/instrument-sans";
import "./globals.css";

export const metadata = siteMetadata;

/**
 * The root layout carries the document and nothing else.
 *
 * Chrome lives in (site)/layout.tsx so that (bare) routes — the link-in-bio hub —
 * genuinely render without a nav. Two *root* layouts under route groups would be
 * the textbook answer, but vinext applies the first group's root layout to every
 * route, so the hub kept the chrome it is meant to drop. A bare root plus a
 * nested chrome layout gets the same result and does not depend on that feature.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MotionStage />
        {children}
        <PreviewRibbon />
      </body>
    </html>
  );
}
