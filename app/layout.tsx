import { MotionStage } from "../components/motion/stage";
import { siteMetadata } from "../lib/document";
// Self-hosted rather than a fonts.googleapis.com <link>: no third-party request,
// nothing render-blocking, and it works in a sandbox with no egress.
import "@fontsource-variable/fraunces";
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
      </body>
    </html>
  );
}
