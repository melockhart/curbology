"use client";

import { useEffect } from "react";

/**
 * Two things the glass bar needs a browser for, and nothing else.
 *
 * Both are enhancements on top of markup that already works: without this
 * component the bar is still glass and the menu still opens and closes, because
 * it is a <details> element and that is the whole point of using one.
 *
 *   1. The lift. Once the page has moved underneath it, the bar earns a shadow.
 *      At rest over the hero it has none, so it reads as part of the hero
 *      rather than as a bar sitting on top of one.
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
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        header.dataset.stuck = String(window.scrollY > 8);
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
