"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * The before/after slider — the single most persuasive element on an exterior
 * cleaning site, and the one mechanism the prototype library did not already
 * cover. It belongs back in there as a prototype once it has run in production.
 *
 * Keyboard operable on purpose: it is a real slider, so it is a real
 * range input with a visible focus ring, not a div that only responds to drag.
 */
export function BeforeAfter({
  before, after, beforeAlt, afterAlt, caption,
}: { before?: string; after?: string; beforeAlt: string; afterAlt: string; caption?: string }) {
  const [split, setSplit] = useState(50);
  const [width, setWidth] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  /*
   * The clipped "before" image has to be pinned to the wrapper's full width, or
   * it squashes as the reveal narrows instead of being cropped by it.
   *
   * That width is measured, not read off the ref during render — a ref is null
   * on first paint and changing it never re-renders, so the naive version drew
   * a squashed image until something else happened to update the component, and
   * stayed wrong through every resize.
   */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const drag = useCallback((clientX: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    setSplit(Math.max(0, Math.min(100, ((clientX - box.left) / box.width) * 100)));
  }, []);

  // Both halves are missing until Tristen supplies photography. Rendering the
  // mechanism over two empty plates would be a slider with nothing to compare,
  // so say what it is waiting for instead.
  if (!before || !after) {
    // No ground class on the figure: it inherits the section's, so --muted is
    // the one that actually passes on whatever is behind it. Hardcoding
    // ground-paper here put slate on a teal section at 3.07:1.
    return (
      <figure>
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-current/25 px-6 py-10 text-center text-[color:var(--muted)]">
          <p className="max-w-xs text-sm">
            <span className="block font-medium">Before and after to come</span>
            {caption ?? "A matched pair — same house, same angle, same light."}
          </p>
        </div>
      </figure>
    );
  }

  return (
    <figure>
      <div
        ref={wrap}
        className="relative aspect-[4/3] select-none overflow-hidden rounded-2xl"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons === 1) drag(e.clientX); }}
      >
        {/*
          Plain <img>, not next/image: these load from client-supplied storage
          through the Worker rather than the Next optimizer, and the slider needs
          both layers at identical intrinsic size for the crop to line up.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt={afterAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${split}%` }}>
          {/* Fixed to the wrapper width so the image does not squash as it clips. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={before} alt={beforeAlt}
            className="absolute inset-0 h-full max-w-none object-cover"
            style={{ width: width || "100%" }}
          />
        </div>

        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
          style={{ left: `${split}%` }}
          aria-hidden="true"
        >
          <span className="btn btn--paper absolute top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 !p-0">
            ⇄
          </span>
        </div>

        <label className="sr-only" htmlFor="ba-range">Reveal the before image</label>
        <input
          id="ba-range" type="range" min={0} max={100} value={split}
          onChange={(e) => setSplit(Number(e.target.value))}
          className="absolute inset-x-0 bottom-3 mx-auto w-[92%] cursor-ew-resize opacity-0 focus-visible:opacity-100"
        />
      </div>
      {caption && <figcaption className="mt-3 text-sm text-[color:var(--muted)]">{caption}</figcaption>}
    </figure>
  );
}
