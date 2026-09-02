"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Full-bleed scroll cinema: a media plate that starts inset and rounded, then
 * opens to the full width of the viewport as it passes through the middle of
 * the screen.
 *
 * Driven off a single rAF-throttled scroll listener writing two custom
 * properties, so the browser animates transform and border-radius rather than
 * re-laying out. Nothing here changes document flow — the plate's box is fixed
 * and only its visual presentation scales, which is what keeps it cheap.
 */
export function Cinema({
  children, className = "",
}: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--open", "1");
      return;
    }

    let frame = 0;
    const write = () => {
      frame = 0;
      const box = el.getBoundingClientRect();
      const centre = box.top + box.height / 2;
      // 0 at the edges of the viewport, 1 when the plate is centred.
      const distance = Math.abs(centre - window.innerHeight / 2) / window.innerHeight;
      el.style.setProperty("--open", String(Math.max(0, Math.min(1, 1 - distance * 1.6))));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(write); };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        // At --open 0 the plate is inset and rounded; at 1 it is edge to edge.
        borderRadius: "calc(28px * (1 - var(--open, 0)))",
        transform: "scale(calc(0.9 + 0.1 * var(--open, 0)))",
        transition: "border-radius 120ms linear",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
