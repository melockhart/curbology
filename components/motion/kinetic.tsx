"use client";

import { useEffect, useRef } from "react";

/**
 * Headline that arrives a word at a time.
 *
 * Splitting happens in an effect, so the server sends one plain string and a
 * screen reader hears one heading rather than a list of loose words. If the
 * script never runs, the headline is simply already there — which is the right
 * failure for the largest text on the page.
 */
export function Kinetic({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const words = text.split(" ");
    host.textContent = "";
    // The visible words are decorative once split; the accessible name comes
    // from aria-label on the host.
    host.setAttribute("aria-hidden", "true");

    for (const [i, word] of words.entries()) {
      const outer = document.createElement("span");
      outer.style.display = "inline-block";
      outer.style.overflow = "hidden";
      outer.style.verticalAlign = "top";
      const inner = document.createElement("span");
      inner.style.display = "inline-block";
      inner.style.transform = "translateY(105%)";
      inner.style.transition =
        `transform var(--dur-slow) var(--ease-out) ${i * 55}ms`;
      inner.textContent = word;
      outer.appendChild(inner);
      host.appendChild(outer);
      if (i < words.length - 1) host.appendChild(document.createTextNode(" "));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        inner.style.transform = "translateY(0)";
      }));
    }
  }, [text]);

  return (
    <span className={className}>
      <span ref={ref}>{text}</span>
    </span>
  );
}
