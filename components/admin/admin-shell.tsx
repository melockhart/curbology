"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { A } from "../link";
import { NAV_GROUPS, buildCrumbs, isActive, type NavItem } from "../../lib/admin/nav-config";
import { CommandPalette } from "./command-palette";
import { IconChevron, IconExternal, IconLock, IconSearch } from "./icons";

const COLLAPSE_KEY = "curbology:admin-sb-collapsed";

/**
 * The console shell — sidebar, topbar, palette host, mobile strip.
 *
 * Everything structural here reads NAV_GROUPS. Nothing in this file knows the
 * name of a single screen, which is what makes "add a screen = add a NavItem
 * plus a route" true rather than aspirational.
 *
 * It is a client component because three things genuinely need the browser: the
 * collapse preference, the ⌘K shortcut, and the active-item highlight. Its
 * `children` are still server-rendered — the screens do their own database work
 * and arrive here already rendered.
 */
export function AdminShell({
  children, user, isGodMode,
}: { children: ReactNode; user: string; isGodMode: boolean }) {
  const pathname = usePathname() ?? "/admin";
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);

  // Read after mount, not during render: localStorage does not exist on the
  // server, and guessing at it produces a hydration mismatch that React repairs
  // by throwing the server's markup away.
  //
  // Applied in a frame rather than in the effect body so the console paints
  // before the sidebar settles, instead of the commit cascading a second render
  // that blocks it.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* private mode */ }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try { window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* private mode */ }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const refuse = (to: string) => {
    setShaking(to);
    window.setTimeout(() => setShaking((s) => (s === to ? null : s)), 340);
  };

  const crumbs = buildCrumbs(pathname);

  return (
    <div className="console min-h-screen bg-[color:var(--console-bg)] text-ink lg:flex">
      <aside
        className={`hidden shrink-0 border-r border-[color:var(--console-line)] bg-[color:var(--console-sidebar)] lg:flex lg:h-screen lg:sticky lg:top-0 lg:flex-col ${
          collapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <div className={`flex items-center gap-3 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-teal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/curbology-logo.png" alt="" className="h-6 w-auto" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-bold leading-tight">Curbology</span>
              <span className="eyebrow block">Console</span>
            </span>
          )}
        </div>

        <nav aria-label="Console" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              {!collapsed && <p className="eyebrow px-3 pb-1.5">{group.label}</p>}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      item={item} collapsed={collapsed} isGodMode={isGodMode}
                      active={isActive(item, pathname)}
                      shaking={shaking === item.to}
                      onRefuse={() => refuse(item.to)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[color:var(--console-line)] px-2 py-3">
          {!collapsed && (
            <p className="truncate px-3 pb-2 text-xs text-[color:var(--muted)]" title={user}>
              {user}
              {isGodMode && <span className="ml-1.5 text-ink">· owner</span>}
            </p>
          )}
          <A
            href="/"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-ink/5 ${collapsed ? "justify-center px-0" : ""}`}
            title="View site"
          >
            <IconExternal className="h-[18px] w-[18px] shrink-0 text-[color:var(--muted)]" />
            {!collapsed && <span>View site</span>}
          </A>
          <form action="/api/sign-out" method="post">
            <button
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5 ${collapsed ? "justify-center px-0" : ""}`}
              title="Sign out"
            >
              <IconLock className="h-[18px] w-[18px] shrink-0 text-[color:var(--muted)]" />
              {!collapsed && <span>Sign out</span>}
            </button>
          </form>
          <button
            type="button" onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-ink/5 ${collapsed ? "justify-center px-0" : ""}`}
          >
            <IconChevron className={`h-[18px] w-[18px] shrink-0 text-[color:var(--muted)] ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[color:var(--console-line)] bg-[color:var(--console-bg)]/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
              <ol className="flex items-center gap-2 text-sm">
                {crumbs.map((c, i) => (
                  <li key={c.to} className="flex min-w-0 items-center gap-2">
                    {i > 0 && <IconChevron className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)]" />}
                    {i === crumbs.length - 1 ? (
                      <span className="truncate font-medium" aria-current="page">{c.label}</span>
                    ) : (
                      <A href={c.to} className="truncate text-[color:var(--muted)] hover:underline hover:underline-offset-4">
                        {c.label}
                      </A>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <button
              type="button" onClick={() => setPaletteOpen(true)}
              className="flex min-h-[36px] items-center gap-2 rounded-md border border-ink/20 px-3 text-sm text-[color:var(--muted)] hover:bg-ink/5"
            >
              <IconSearch className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded border border-ink/20 px-1 text-[11px] sm:inline">⌘K</kbd>
            </button>
          </div>

          {/* Mobile: the same nav as a horizontal strip. God-mode items are
              filtered out here rather than locked — there is no room to explain
              a lock, and the palette still shows them. */}
          <nav aria-label="Console" className="overflow-x-auto border-t border-[color:var(--console-line)] lg:hidden">
            <ul className="flex w-max gap-1 px-3 py-2">
              {NAV_GROUPS.flatMap((g) => g.items)
                .filter((i) => !i.godModeOnly || isGodMode)
                .map((item) => (
                  <li key={item.to}>
                    <A
                      href={item.to}
                      aria-current={isActive(item, pathname) ? "page" : undefined}
                      className={`block whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                        isActive(item, pathname) ? "bg-teal text-ink" : "text-[color:var(--muted)]"
                      }`}
                    >
                      {item.label}
                    </A>
                  </li>
                ))}
            </ul>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} isGodMode={isGodMode} />
    </div>
  );
}

function NavLink({
  item, collapsed, active, isGodMode, shaking, onRefuse,
}: {
  item: NavItem; collapsed: boolean; active: boolean; isGodMode: boolean;
  shaking: boolean; onRefuse: () => void;
}) {
  const locked = Boolean(item.godModeOnly && !isGodMode);
  const Icon = item.icon;

  const inner = (
    <>
      {/* The active bar is a child, not a border, so it does not shift the
          label by a pixel when it appears. */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-teal ${active ? "" : "hidden"}`}
      />
      <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-ink" : "text-[color:var(--muted)]"}`} />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.beta && (
            <span className="rounded bg-ink/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--muted)]">
              beta
            </span>
          )}
          {locked && <IconLock className="h-4 w-4 text-[color:var(--muted)]" />}
        </>
      )}
    </>
  );

  const base = `relative flex items-center gap-3 rounded-md py-1.5 text-sm ${
    collapsed ? "justify-center px-0" : "px-3"
  } ${active ? "bg-teal/15 font-medium" : "hover:bg-ink/5"}`;

  if (locked) {
    return (
      <button
        type="button" onClick={onRefuse} title={`${item.label} — owner only`}
        aria-disabled="true"
        className={`${base} w-full text-left opacity-60 ${shaking ? "shake" : ""}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <A href={item.to} title={collapsed ? item.label : undefined}
       aria-current={active ? "page" : undefined} className={base}>
      {inner}
    </A>
  );
}
