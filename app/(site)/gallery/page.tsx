import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../../components/ui";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/gallery", { title: "Our work" });
}

/**
 * Absorbs the live site's "Portfolio Page" — a better label, and the same six
 * numbered entries, verbatim.
 *
 * No images: none were captured. Honest empty states rather than stock, which on
 * an exterior-cleaning site would actively cost trust — the whole sale is "this
 * is what your house will look like".
 *
 * When real photos arrive, caption each with service and town. Captions are
 * searchable text and most galleries waste them.
 */
export default async function GalleryPage() {
  const { portfolio, pages, images } = await siteContent();
  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">{pages.gallery.ourWork}</h1>
        <p className="mt-6 max-w-xl text-lg">
          {pages.gallery.beforeAndAfterAcross}
        </p>
      </Section>

      <Section cut="l" ground="shallow">
        <ul className="grid gap-x-10 gap-y-16 md:grid-cols-2">
          {portfolio.map((item, index) => (
            <li key={item.n}>
              <AwaitingPhoto label={`${item.title} — before and after.`} image={images[`gallery.${index}`]} />
              <Eyebrow>{item.n}</Eyebrow>
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-3 text-[color:var(--muted)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section cut="r" ground="ink">
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">{pages.gallery.wantYoursToLook}</h2>
        <div className="mt-8"><Button href="/quote">{pages.gallery.getAFreeQuote}</Button></div>
      </Section>
    </>
  );
}
