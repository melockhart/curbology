"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-linked translation, driven by rAF off a passive scroll listener.
 *
 * Deliberately not `animation-timeline: view()` — support is still uneven and a
 * silent no-op on a hero is worse than a few frames of JS. The transform is
 * written once per frame at most, never per scroll event.
 */
export function Parallax({
  children, strength = 0.18, className,
}: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const write = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      // Progress of the element through the viewport, -1 (below) to 1 (above).
      const progress = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
      el.style.transform = `translate3d(0, ${(progress * strength * 100).toFixed(2)}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [strength]);

  return <div ref={ref} className={className} style={{ willChange: "transform" }}>{children}</div>;
}
