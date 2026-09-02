import { Nav, Footer } from "../../components/chrome";
import { A } from "../../components/link";

/** Everything that wears the site's chrome. Nested inside the bare root layout. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <A
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Skip to content
      </A>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
