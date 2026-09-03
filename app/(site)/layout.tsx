import { Nav, Footer } from "../../components/chrome";
import { A } from "../../components/link";
import { siteSettings } from "../../lib/db";
import { Wash } from "../../components/motion/wash";
import { Preloader } from "../../components/motion/preloader";

/** Everything that wears the site's chrome. Nested inside the bare root layout. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await siteSettings();
  const banner = typeof settings["site.banner"] === "string" ? (settings["site.banner"] as string).trim() : "";

  return (
    <>
      <A
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </A>
      {/* Above the header, so it is not something the nav can scroll away from.
          Ink on teal is 6.66:1 — the accent is a ground here, never the text. */}
      {banner && (
        <p role="status" className="ground-teal bg-teal px-4 py-2.5 text-center text-sm font-medium text-ink">
          {banner}
        </p>
      )}
      {/* Marketing pages only: the wash reads as a journey here, and Lenis is
          worth its cost. The portals keep the palette and the type and take
          neither — a quote form reached from a text message is not the place
          for a scroll library. */}
      <Preloader />
      <Wash smooth />
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
