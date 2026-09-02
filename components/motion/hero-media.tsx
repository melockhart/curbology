"use client";

import { useEffect, useRef } from "react";

/**
 * The open centre of the hero.
 *
 * Three layers, in order of what actually exists:
 *   1. A generative water-light field on canvas — ships today, needs nothing.
 *   2. A poster still, once there is one.
 *   3. The video loop, once Tristen shoots it.
 *
 * The canvas is not a placeholder to be deleted. It stays as the backdrop the
 * footage sits on, so the hero never has a frame where it is empty — including
 * the seconds before a video decodes, which is exactly when a visitor decides
 * whether this looks like a real company.
 *
 * Cheap on purpose: rendered at 240×135 and scaled up under a blur, so the
 * per-frame cost is a few hundred pixels rather than a few million. It pauses
 * when scrolled out of view or when the tab is hidden — an animation nobody can
 * see is pure battery cost on exactly the phones this audience uses.
 */
export function HeroMedia({
  videoSrc, poster, label,
}: { videoSrc?: string; poster?: string; label: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const wrap = host.current;
    if (!el || !wrap) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const W = (el.width = 240);
    const H = (el.height = 135);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Caustics: overlapping light pools drifting on incommensurate periods, so
    // the pattern never visibly repeats. Blurred in CSS, it reads as water.
    const pools = Array.from({ length: 7 }, (_, i) => ({
      ax: 0.6 + i * 0.13, ay: 0.4 + i * 0.09,
      px: i * 1.7, py: i * 2.3,
      r: 34 + (i % 3) * 16,
    }));

    const draw = (t: number) => {
      ctx.fillStyle = "#04b8ba";
      ctx.fillRect(0, 0, W, H);
      for (const p of pools) {
        const x = W / 2 + Math.sin(t * 0.00021 * p.ax + p.px) * (W * 0.42);
        const y = H / 2 + Math.cos(t * 0.00017 * p.ay + p.py) * (H * 0.46);
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
        g.addColorStop(0, "rgba(190,255,252,0.42)");
        g.addColorStop(0.55, "rgba(64,214,214,0.18)");
        g.addColorStop(1, "rgba(4,184,186,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };

    if (calm) { draw(0); return; }

    let frame = 0;
    let running = true;
    const loop = (t: number) => {
      if (!running) return;
      draw(t);
      frame = requestAnimationFrame(loop);
    };

    const stop = () => { running = false; if (frame) cancelAnimationFrame(frame); frame = 0; };
    const go = () => { if (running) return; running = true; frame = requestAnimationFrame(loop); };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? go() : stop()), { threshold: 0.01 });
    io.observe(wrap);
    const onVisibility = () => (document.hidden ? stop() : go());
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(loop);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div ref={host} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvas}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{ filter: "blur(22px) contrast(1.35) saturate(1.1)", transform: "scale(1.15)" }}
      />

      {videoSrc && (
        // muted + playsInline + autoPlay is the only combination iOS will play
        // inline. Without playsInline it goes fullscreen on tap; without muted
        // it does not autoplay at all.
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
        />
      )}

      {!videoSrc && (
        <div className="absolute inset-0 flex items-end justify-center p-6">
          <p className="rounded-full bg-ink/85 px-4 py-2 text-sm text-paper">
            Footage to come — a slow, close loop of the work
          </p>
        </div>
      )}
    </div>
  );
}
