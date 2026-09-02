"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Entry loader and route covers.
 *
 * ⚠️ THE RULE: this never delays the phone number.
 *
 * The page renders underneath from the first frame. The loader is an overlay
 * that removes itself — so if the bundle fails, or JS is off, or the browser
 * blocks storage, the visitor gets the site immediately. Every failure mode
 * falls toward "no loader", never toward "blank screen". On a site whose job is
 * a call, a splash that can strand someone is a worse bug than no splash.
 *
 * Progress is real. It tracks the document's own images and fonts rather than
 * animating a timer, because a fake bar that finishes before the hero image does
 * is the thing that makes a site feel slow. Ported from prototype P-004.
 */

const ONCE_KEY = "curbology-loader:session";

/** Shown once a session. Storage refusing — a private window, a locked-down
 *  browser — falls toward showing it, which is the safe direction. */
function alreadySeen() {
  try {
    return Boolean(sessionStorage.getItem(ONCE_KEY));
  } catch {
    return false;
  }
}
function remember() {
  try {
    sessionStorage.setItem(ONCE_KEY, String(Date.now()));
  } catch {
    /* Nothing to do; it shows again next time, which is harmless. */
  }
}

/** Everything the first screen is actually waiting on. */
function documentReady(): Promise<void> {
  const waits: Promise<unknown>[] = [];
  for (const image of Array.from(document.images)) {
    if (image.complete) continue;
    waits.push(new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }));
  }
  if (document.fonts?.ready) waits.push(document.fonts.ready);
  return Promise.all(waits).then(() => undefined);
}

export function EntryLoader() {
  const [state, setState] = useState<"idle" | "showing" | "leaving" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const path = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Nothing to do when it should not play: "idle" already renders null, so
    // leaving it alone is both correct and one less render.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || alreadySeen()) return;

    // Mounted on the next frame rather than synchronously, so the page paints
    // underneath first. That is this loader's whole premise — the overlay
    // arrives over content that is already there — and it avoids a cascading
    // render on mount.
    const start = requestAnimationFrame(() => {
      setState("showing");
      // Marked when it *starts*, not when it finishes. Someone who navigates
      // away mid-load has still seen it, and recording it at the end means a
      // slow first page shows the splash again on the next one — the exact
      // behaviour once-per-session exists to prevent.
      remember();
      document.documentElement.style.overflow = "hidden";
    });

    // Creep toward 90% so there is motion while assets settle, then let the
    // real completion take it home. It never claims 100% before it is true.
    let value = 0;
    const creep = window.setInterval(() => {
      value = Math.min(90, value + (90 - value) * 0.08 + 1);
      setProgress(value);
    }, 90);

    // A hard ceiling. A stalled asset must not trap anyone behind a splash.
    const ceiling = window.setTimeout(() => finish(), 3500);

    const finish = () => {
      window.clearInterval(creep);
      window.clearTimeout(ceiling);
      setProgress(100);
      setState("leaving");
      window.setTimeout(() => {
        document.documentElement.style.overflow = "";
        setState("done");
      }, 700);
    };

    documentReady().then(finish);

    return () => {
      cancelAnimationFrame(start);
      window.clearInterval(creep);
      window.clearTimeout(ceiling);
      document.documentElement.style.overflow = "";
    };
  }, []);

  /*
   * The real badge, revealed by a wipe.
   *
   * The previous version stroke-animated a hand-drawn SVG path — a nice effect
   * for a mark that was only ever a stand-in. A PNG cannot draw itself, and a
   * path that merely resembles the logo is not the logo, so the reveal moved to
   * a clip instead of the artwork moving to fit the reveal.
   */
  useEffect(() => {
    const node = path.current;
    if (!node || state !== "showing") return;
    node.style.clipPath = "inset(0 100% 0 0)";
    requestAnimationFrame(() => {
      node.style.transition = "clip-path 900ms var(--ease-out)";
      node.style.clipPath = "inset(0 0 0 0)";
    });
  }, [state]);

  if (state === "done" || state === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-teal"
      style={{
        transform: state === "leaving" ? "translateY(-100%)" : "translateY(0)",
        transition: "transform var(--dur-cover) var(--ease-cover)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={path}
        src="/brand/curbology-logo.png"
        alt=""
        width={188}
        height={120}
        style={{ width: 188, height: "auto" }}
      />
      <div className="mt-8 h-px w-40 overflow-hidden bg-ink/20">
        <div
          className="h-full bg-ink"
          style={{ width: `${progress}%`, transition: "width 220ms linear" }}
        />
      </div>
    </div>
  );
}

/**
 * A branded wipe between routes. Plays on arrival at a new path — never on the
 * first render, which the entry loader already owns.
 */
export function RouteCover({ pathname }: { pathname: string }) {
  const first = useRef(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = requestAnimationFrame(() => setPlaying(true));
    const t = window.setTimeout(() => setPlaying(false), 620);
    return () => { cancelAnimationFrame(start); window.clearTimeout(t); };
  }, [pathname]);

  if (!playing) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] bg-teal"
      style={{ animation: "cover-wipe var(--dur-cover) var(--ease-cover) forwards" }}
    />
  );
}
