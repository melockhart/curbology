"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Scroll reveal, armed by script rather than by stylesheet.
 *
 * The hidden state is added in an effect, so a browser with no JS — or one where
 * the bundle failed — renders the content visible instead of blank. On a site
 * whose entire job is getting someone to a phone number, "invisible until proven
 * otherwise" is the wrong default.
 *
 * Honours prefers-reduced-motion by never arming at all.
 */
export function Reveal({
  children, delay = 0, as: Tag = "div", className,
}: { children: ReactNode; delay?: number; as?: "div" | "section" | "li" | "article"; className?: string }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.setProperty("--reveal-delay", `${delay}ms`);
    el.classList.add("is-armed");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.classList.remove("is-armed");
          el.classList.add("is-in");
          io.unobserve(el);
        }
      },
      // Fire a little before the element reaches the fold, so the motion has
      // finished by the time it is properly in view rather than starting there.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref as never} data-reveal className={className}>
      {children}
    </Tag>
  );
}

/** Reveals children in sequence. The stagger is the point; the delay is derived. */
export function RevealGroup({
  children, step = 90, className, as,
}: { children: ReactNode[]; step?: number; className?: string; as?: "div" | "li" }) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal key={i} delay={i * step} className={className} as={as}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
