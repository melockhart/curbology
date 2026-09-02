"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_NAV_ITEMS, type NavItem } from "../../lib/admin/nav-config";
import { IconLock, IconSearch } from "./icons";

/**
 * ⌘K.
 *
 * It derives from ALL_NAV_ITEMS, which is the point: a screen added to the nav
 * is reachable here the same day, and a screen removed from the nav cannot be
 * reached here at all. Hand-listing the commands is how a palette ends up
 * offering a route that 404s.
 *
 * God-mode items are shown but not opened — hiding them would make the console
 * look different to different people for no security benefit, since the route
 * itself is what actually refuses.
 */
export function CommandPalette({
  open, onClose, isGodMode,
}: { open: boolean; onClose: () => void; isGodMode: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.to.toLowerCase().includes(q) ||
        (i.hint ?? "").toLowerCase().includes(q),
    );
  }, [query]);

  // Focus and reset after paint. Focusing during the commit runs before the
  // dialog is laid out and Safari drops it; resetting there cascades a second
  // render before the palette has appeared at all.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setQuery("");
      setCursor(0);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open) return null;

  const go = (item: NavItem) => {
    if (item.godModeOnly && !isGodMode) return;
    onClose();
    router.push(item.to);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Search the console"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-ink/15 bg-[color:var(--console-surface)] shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--console-line)] px-4">
          <IconSearch className="h-[18px] w-[18px] shrink-0 text-[color:var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            placeholder="Go to…"
            aria-label="Go to"
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { e.preventDefault(); onClose(); }
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              if (e.key === "Enter" && results[cursor]) { e.preventDefault(); go(results[cursor]); }
            }}
            className="min-h-[52px] w-full bg-transparent text-[15px] outline-none placeholder:text-[color:var(--muted)]"
          />
          <kbd className="rounded border border-ink/20 px-1.5 py-0.5 text-[11px] text-[color:var(--muted)]">esc</kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">Nothing matches “{query}”.</li>
          )}
          {results.map((item, i) => {
            const locked = Boolean(item.godModeOnly && !isGodMode);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(item)}
                  aria-disabled={locked}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                    i === cursor ? "bg-teal/15" : ""
                  } ${locked ? "opacity-55" : ""}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0 text-[color:var(--muted)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.label}</span>
                    {item.hint && <span className="block truncate text-xs text-[color:var(--muted)]">{item.hint}</span>}
                  </span>
                  {locked && <IconLock className="h-4 w-4 text-[color:var(--muted)]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
