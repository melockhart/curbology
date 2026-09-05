"use client";

import { useEffect } from "react";

/**
 * Two things the glass bar needs a browser for, and nothing else.
 *
 * Both are enhancements on top of markup that already works: without this
 * component the bar is still glass and the menu still opens and closes, because
 * it is a <details> element and that is the whole point of using one.
 *
 *   1. The condense. Once the page has moved underneath it, the bar earns a
 *      shadow and gives back roughly 28px of screen — the inset closes, the
 *      padding closes, the mark reduces, the controls shorten. At rest over the
 *      hero it has full height and no shadow, so it reads as part of the hero
 *      rather than as a bar sitting on top of one. All four sizes are custom
 *      properties on .glass; this sets one attribute and CSS does the rest.
 *
 *   2. Escape, and clicking away. A menu that only closes by pressing the same
 *      control again is the kind of thing nobody reports and everybody resents.
 */
export function HeaderBehaviour() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const menu = header.querySelector<HTMLDetailsElement>("details");

    // Read once per frame at most. A scroll handler that touches the DOM on
    // every event is the classic way to make a smooth page feel cheap.
    //
    // Two thresholds, not one. The flag now drives the bar's height as well as
    // its shadow, so a single boundary at 8px meant a page resting there — a
    // trackpad nudge, a focus scroll, momentum settling — could sit on the edge
    // and flip the bar open and shut. It condenses past 28px and only expands
    // again below 6px, so the two states cannot chatter.
    let queued = false;
    let stuck = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        const y = window.scrollY;
        const next = stuck ? y > 6 : y > 28;
        if (next === stuck) return;
        stuck = next;
        header.dataset.stuck = String(stuck);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const close = () => { if (menu?.open) menu.open = false; };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !menu?.open) return;
      close();
      // Focus goes back to the control that opened it, or it lands nowhere and
      // a keyboard user is stranded at the top of the document.
      menu.querySelector<HTMLElement>("summary")?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (menu?.open && !menu.contains(e.target as Node)) close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return null;
}
