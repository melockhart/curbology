"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The preloader — one of the four locked hard-blocks, built from P-004.
 *
 * A wordmark in live text rather than a drawn logo. The only mark that exists
 * for this business is a 223×142 raster badge recovered out of a PDF; there is
 * no vector to stroke in. Live text is sharp at any size, needs nothing from
 * the client, and survives the badge being replaced — and Fraunces set at 900
 * with the axes running is a better mark than the badge is.
 *
 * Three things from P-004's card that separate a real loading screen from a
 * picture of one, all of them taken:
 *
 *   driver: real — it counts fonts and images actually arriving, not a timer.
 *     A bar that finishes before the page does is theatre.
 *   once: session — a splash on every visit is the fastest way to make a site
 *     feel slow.
 *   a hard timeout — a broken asset must never trap someone here forever.
 *
 * The exit is a wash, because the wash is the site's whole idea and the first
 * thing anybody sees should be it. The wordmark does not disappear and get
 * replaced: it travels to where the header mark sits, which is the "hero
 * dissolve" half of the block done properly.
 */
const KEY = "curbology:seen-loader";
const TIMEOUT = 8000;
const MIN_ON_SCREEN = 900;

export function Preloader() {
  const [state, setState] = useState<"hidden" | "loading" | "leaving">("hidden");
  const [shown, setShown] = useState(0);
  const target = useRef(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Marked at the START, not at the end. Marking on completion means a
    // second navigation inside the same session replays the whole thing,
    // which is how a loader people liked once becomes a loader they resent.
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      return; // No storage, no loader. Better than one that always plays.
    }

    // Deferred a frame: setting state synchronously in an effect cascades a
    // second render before the first has painted, which on a loading screen is
    // the one place that cost is actually visible.
    const enter = requestAnimationFrame(() => setState("loading"));
    const started = performance.now();
    let raf = 0;
    let done = false;

    /* Real progress: the document's own fonts and images. These are the assets
       that make a page feel slow, and they are the ones nobody remembers to
       list. */
    const assets: Promise<unknown>[] = [document.fonts.ready];
    for (const img of Array.from(document.images)) {
      if (!img.complete) {
        assets.push(new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }));
      }
    }
    let settled = 0;
    for (const asset of assets) {
      void Promise.resolve(asset).then(() => {
        settled += 1;
        target.current = settled / assets.length;
      });
    }

    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN_ON_SCREEN - (performance.now() - started));
      window.setTimeout(() => {
        target.current = 1;
        window.setTimeout(() => setState("leaving"), 260);
        window.setTimeout(() => setState("hidden"), 260 + 1000);
      }, wait);
    };

    void Promise.all(assets).then(finish);
    const bail = window.setTimeout(finish, TIMEOUT);

    /* The eye sees a different number from the one the engine knows. Real
       progress is a step function — three assets settle at 0, 33, 66, 100 —
       so the shown value chases the true one and trickles while it waits,
       approaching but never reaching full, because completion is the one
       thing a guess must never claim. */
    const loop = () => {
      setShown((current) => {
        const gap = target.current - current;
        const eased = current + gap * 0.12;
        const trickled = gap < 0.001 && target.current < 1
          ? current + (0.985 - current) * 0.012
          : eased;
        return Math.min(trickled, target.current < 1 ? 0.985 : 1);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(enter);
      cancelAnimationFrame(raf);
      window.clearTimeout(bail);
    };
  }, []);

  if (state === "hidden") return null;

  const pct = Math.round(shown * 100);

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-leaving={state === "leaving"}
      className="preloader ground-deep fixed inset-0 z-[200] grid place-items-center bg-teal-900"
    >
      <div className="grime-layer" style={{ ["--grime" as string]: 1 - shown }} />
      <div className="relative z-[2] w-full max-w-5xl px-6 text-center">
        <p
          className="preloader-mark font-display font-black leading-none tracking-tight text-stone-050"
          style={{
            fontSize: "clamp(2.5rem, 11vw, 9rem)",
            ["--fx-soft" as string]: 100 - shown * 100,
            ["--fx-wonk" as string]: 1 - shown,
          }}
        >
          CURBOLOGY
        </p>
        <div className="mx-auto mt-8 h-px w-full max-w-md bg-stone-050/25">
          <div
            className="h-px bg-teal-300"
            style={{ width: `${pct}%`, transition: "width 120ms linear" }}
          />
        </div>
        <p className="font-spec mt-4 text-xs tracking-[0.22em] text-stone-400">{pct}%</p>
      </div>
    </div>
  );
}
