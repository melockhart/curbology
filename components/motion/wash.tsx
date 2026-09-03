"use client";

import { useEffect } from "react";

/**
 * The wash driver.
 *
 * One scroll-linked value per section, feeding three things at once — the
 * boundary, the grime, and the type axes. They are driven from a single
 * progress number rather than three animations, because three animations on
 * one idea drift, and a boundary that has passed while the letterforms are
 * still soft looks like a bug rather than a transition.
 *
 * Marketing pages only. The portals and the console are dependency-free: a
 * quote form reached from a text message is not the place for a scroll
 * library, and someone opening an unsubscribe link is not there to be
 * delighted.
 *
 * The whole thing is progressive. The server HTML already carries the finished
 * state — `--wash: 1` is the default on the element — so with JavaScript off,
 * or before this loads, the page is simply clean. Nothing is parked at zero
 * waiting for a script to rescue it, which is the failure mode that leaves a
 * site blank for anyone whose bundle did not arrive.
 */
export function Wash({ smooth = true }: { smooth?: boolean }) {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-wash-section]"),
    );
    if (reduced || sections.length === 0) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // Lenis only where the page is meant to be read as a journey. It takes
      // over the scroll, and taking over the scroll on a transactional page is
      // a cost paid by everyone to benefit nobody.
      let lenis: InstanceType<typeof import("lenis").default> | null = null;
      let tick: ((time: number) => void) | null = null;
      if (smooth) {
        const { default: Lenis } = await import("lenis");
        if (cancelled) return;
        lenis = new Lenis({ duration: 0.9, smoothWheel: true });
        tick = (time: number) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        lenis.on("scroll", ScrollTrigger.update);
      }

      for (const section of sections) {
        // Sections start dirty and are cleaned on the way past. The first one
        // is exempt: a hero that arrives already grubby and then improves
        // reads as a page that failed to load rather than as an idea.
        const first = section === sections[0];
        gsap.set(section, { "--wash": first ? 1 : 0, "--grime": first ? 0 : 1 });

        if (first) continue;

        gsap.to(section, {
          "--wash": 1,
          "--grime": 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            // From the section's top edge reaching the bottom of the viewport
            // to it settling a third of the way up: the wash completes as the
            // section arrives, not after it has already been read.
            start: "top bottom",
            end: "top 33%",
            scrub: 0.6,
          },
        });
      }

      ScrollTrigger.refresh();

      cleanup = () => {
        for (const t of ScrollTrigger.getAll()) t.kill();
        if (tick) gsap.ticker.remove(tick);
        lenis?.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [smooth]);

  return null;
}
