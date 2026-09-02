import type { Metadata } from "next";
import { business, home } from "../../lib/content";
import { Button, Section, Eyebrow, AwaitingPhoto } from "../../components/ui";

export const metadata: Metadata = { title: "About" };

/**
 * The live site has no About page. This one is built from the copy that does
 * exist — the homepage's own about block — plus honest empty states for the
 * things only Tristen can supply: his name, his face, and how long he has been
 * doing this.
 *
 * No "3+ Years of Expertise" here. That was one of the unsourced stats.
 */
export default function AboutPage() {
  return (
    <>
      <Section ground="teal">
        <h1 className="max-w-3xl text-5xl">{home.aboutHeading}</h1>
      </Section>

      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-lg text-slate">{home.aboutBody}</p>
            <p className="mt-6 text-lg text-slate">
              We work across {business.serviceArea.county},{" "}
              {business.serviceArea.state}
              {business.serviceArea.townsNamed.length > 0 &&
                `, including ${business.serviceArea.townsNamed.join(", ")}`}
              .
            </p>
          </div>
          <AwaitingPhoto label="The owner. This is the single most valuable photo on the site — a face is why a stranger lets someone onto their property with a pressure washer." />
        </div>
      </Section>

      <Section ground="ink">
        <Eyebrow>Ready when you are</Eyebrow>
        <h2 className="max-w-2xl text-4xl text-paper">Get a free quote</h2>
        <div className="mt-8"><Button href="/contact">Request a quote</Button></div>
      </Section>
    </>
  );
}
