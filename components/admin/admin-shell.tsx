"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import "@fontsource-variable/archivo/wdth.css";
import { A } from "../link";
import "./console.css";

/** The five pages of the simplified console, in the approved order. */
export const CONSOLE_PAGES = [
  { to: "/admin", label: "Today" },
  { to: "/admin/quotes", label: "Quotes" },
  { to: "/admin/leads", label: "Leads" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/rates", label: "Rates" },
] as const;

const active = (pathname: string, to: string) => (to === "/admin" ? pathname === "/admin" : pathname.startsWith(to));

/**
 * Navy rail on a wide screen, a top bar and bottom tabs on a phone. A client
 * component only for the active highlight; every page under it renders on the server.
 */
export function AdminShell({ children, user }: { children: ReactNode; user: string; isGodMode?: boolean }) {
  const pathname = usePathname() ?? "/admin";
  const signOut = (
    <form action="/api/sign-out" method="post">
      <button className="cx-out">Sign out</button>
    </form>
  );
  return (
    <div className="cx">
      <aside className="cx-rail" aria-label="Console">
        <A href="/admin" className="cx-mark" aria-label="Today">
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo, as on the site */}
          <img src="/v2/logo.png" alt="Curbology" />
        </A>
        <nav className="flex flex-col gap-1">
          {CONSOLE_PAGES.map((page) => (
            <A key={page.to} href={page.to} className="cx-ni" aria-current={active(pathname, page.to) ? "page" : undefined}>
              {page.label}
            </A>
          ))}
        </nav>
        <div className="flex-1" />
        <p className="cx-who">{user}</p>
        {signOut}
      </aside>
      <header className="cx-top">
        <A href="/admin" aria-label="Today">
          {/* eslint-disable-next-line @next/next/no-img-element -- the logo, as on the site */}
          <img src="/v2/logo.png" alt="Curbology" />
        </A>
        {signOut}
      </header>
      <main className="cx-main">{children}</main>
      <nav className="cx-tabs" aria-label="Console">
        {CONSOLE_PAGES.map((page) => (
          <A key={page.to} href={page.to} aria-current={active(pathname, page.to) ? "page" : undefined}>
            {page.label}
          </A>
        ))}
      </nav>
    </div>
  );
}
