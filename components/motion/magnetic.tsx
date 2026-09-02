"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * The call-to-action leans toward the cursor.
 *
 * Pointer-type gated: `hover: hover` and `pointer: fine`. On a touch screen
 * there is no cursor to lean toward, and binding the listeners anyway costs
 * battery on exactly the devices most of this site's visitors are using.
 */
export function Magnetic({
  children, radius = 90, pull = 0.28, className,
}: { children: ReactNode; radius?: number; pull?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (event: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      if (Math.hypot(dx, dy) > radius + Math.max(box.width, box.height) / 2) {
        el.style.transform = "translate3d(0,0,0)";
        return;
      }
      el.style.transform = `translate3d(${dx * pull}px, ${dy * pull}px, 0)`;
    };
    const reset = () => { el.style.transform = "translate3d(0,0,0)"; };

    el.style.transition = "transform var(--dur-fast) var(--ease-out)";
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", reset);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", reset);
    };
  }, [radius, pull]);

  return <div ref={ref} className={className} style={{ display: "inline-block" }}>{children}</div>;
}
