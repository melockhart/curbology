import type { Metadata } from "next";
import { pageMetadata } from "../../../lib/seo";
import { siteContent } from "../../../lib/cms";
import { publishedTeam } from "../../../lib/db";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../../components/ui";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata("/about", { title: "About" });
}

/**
 * The live site has no About page. This one is built from the copy that does
 * exist — the homepage's own about block — plus honest empty states for the
 * things only Tristen can supply: his name, his face, and how long he has been
 * doing this.
 *
 * No "3+ Years of Expertise" here. That was one of the unsourced stats.
 */
export default async function AboutPage() {
  const { business, home, pages } = await siteContent();
  const team = await publishedTeam();

  return (
    <>
      <Section cut={false} ground="teal">
        <h1 data-wash-type className="max-w-3xl text-5xl">{home.aboutHeading}</h1>
      </Section>

      <Section cut="l" ground="shallow">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-lg text-[color:var(--muted)]">{home.aboutBody}</p>
            <p className="mt-6 text-lg text-[color:var(--muted)]">
              {pages.about.weWorkAcross}{" "}{business.serviceArea.county},{" "}
              {business.serviceArea.state}
              {business.serviceArea.townsNamed.length > 0 &&
                `, including ${business.serviceArea.townsNamed.join(", ")}`}
              .
            </p>
          </div>
          <AwaitingPhoto label={pages.about.theOwnerThisIs} />
        </div>
      </Section>

      {/* Only the people published in the console. Nobody is invented to fill
          the row, so an empty team means this section is simply absent. */}
      {team.length > 0 && (
        <Section cut="r" ground="teal">
          <Eyebrow>{pages.about.whoTurnsUp}</Eyebrow>
          <ul className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((person) => (
              <li key={person.id}>
                {person.photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={person.photo_url} alt={person.name}
                    className="h-40 w-40 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true"
                    className="grid h-40 w-40 place-items-center rounded-full bg-teal font-display text-5xl font-bold text-ink">
                    {person.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <h3 className="mt-5 font-display text-2xl font-bold">{person.name}</h3>
                {person.role_title && <p className="text-[color:var(--muted)]">{person.role_title}</p>}
                {person.bio && <p className="mt-3 text-[color:var(--muted)]">{person.bio}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section cut="l" ground="ink">
        <Eyebrow>{pages.about.readyWhenYouAre}</Eyebrow>
        <h2 data-wash-type className="max-w-2xl text-4xl text-paper">{pages.about.getAFreeQuote}</h2>
        <div className="mt-8"><Button href="/quote">{pages.about.requestAQuote}</Button></div>
      </Section>
    </>
  );
}
