import type { Metadata } from "next";
import { Nav, Footer } from "../components/chrome";
import { business } from "../lib/content";
import "./globals.css";
import { A } from "../components/link";

/**
 * The live site's title was the lowercase, brandless "professional exterior
 * cleaning services", and its og:description truncated the business name to
 * "Curbology Exterior C". Both are fixed here.
 */
export const metadata: Metadata = {
  title: {
    default: `${business.name} — Pressure washing in ${business.serviceArea.county}, ${business.serviceArea.stateAbbr}`,
    template: `%s — ${business.name}`,
  },
  description: `Pressure washing, soft washing, gutter cleaning and roof cleaning across ${business.serviceArea.county}, ${business.serviceArea.state}. Free quotes.`,
  openGraph: { type: "website", siteName: business.name },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/*
          next/font/google would be the better call here — self-hosted, no
          render-blocking request, no warning. It fetches the font files at build
          time from fonts.googleapis.com, which this build environment's egress
          policy blocks, so it would fail the build rather than improve it.
          Switch to next/font when building somewhere with open egress.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Instrument+Sans:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <A
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </A>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
