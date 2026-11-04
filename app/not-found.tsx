import { Nav, Footer } from "../components/chrome";
import { A } from "../components/link";
import { Section } from "../components/ui";
import { services } from "../lib/content";

/**
 * Lives at the app root rather than inside (site), because a 404 can be reached
 * from any URL — including ones under (bare), which has no chrome. It brings its
 * own nav and footer so a wrong link is never a dead end.
 */
export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main">
        <Section ground="teal">
          <p className="font-display text-6xl font-bold">404</p>
          <h1 className="mt-4 max-w-2xl text-5xl">We could not find that page</h1>
          <p className="mt-6 max-w-xl text-lg">
            It may have moved, or the link might have a typo in it. Here is
            everything that does exist.
          </p>
        </Section>

        <Section>
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl">Services</h2>
              <ul className="mt-5 space-y-2">
                {services.map((s) => (
                  <li key={s.slug}>
                    <A href={`/services/${s.slug}`} className="underline underline-offset-4">
                      {s.name}
                    </A>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl">Everything else</h2>
              <ul className="mt-5 space-y-2">
                <li><A href="/" className="underline underline-offset-4">Home</A></li>
                <li><A href="/gallery" className="underline underline-offset-4">Our work</A></li>
                <li><A href="/reviews" className="underline underline-offset-4">Reviews</A></li>
                <li><A href="/service-area" className="underline underline-offset-4">Service area</A></li>
                <li><A href="/faq" className="underline underline-offset-4">Questions</A></li>
                <li><A href="/about" className="underline underline-offset-4">About</A></li>
                <li><A href="/quote" className="underline underline-offset-4">Get a free quote</A></li>
              </ul>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
