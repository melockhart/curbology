"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Live caustics — the material the "water & surface" register promised and did
 * not deliver. The grounds were flat hex fills; this is light moving over them.
 *
 * Raw WebGL2 rather than a library. three.js for one full-screen fragment
 * shader is ~600KB to draw two triangles, and the whole point of a hybrid stack
 * was that weight goes where it earns its place.
 *
 * THREE THINGS IT HAS TO GET RIGHT, none of them about the shader:
 *
 *   It pauses when off-screen. A caustics canvas running behind a section
 *   nobody is looking at is a phone getting warm for nothing.
 *
 *   It falls back to a still. `staticSrc` is one frame of this exact shader,
 *   rendered ahead of time — so a machine with no WebGL sees the material and
 *   loses only the movement, rather than seeing a flat fill and a different
 *   design.
 *
 *   Reduced motion draws one frame and stops. Not "no caustics" — the still is
 *   the design; the movement is the part that was asked to go away.
 */
const VERT = `#version 300 es
void main() {
  /* One oversized triangle rather than a quad: no vertex buffer, no index
     buffer, and the GPU clips what falls outside. */
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColour;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uGround;
uniform vec3  uLight;
uniform float uIntensity;
uniform float uScale;

/* Value noise. Cheap, and at this scale indistinguishable from anything
   more expensive once it has been through the fbm and the warp. */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  /* Aspect-corrected, so the pattern does not stretch on a wide ground. */
  vec2 p = uv * uScale;
  p.x *= uRes.x / uRes.y;

  float t = uTime * 0.06;

  /* Domain warp — the thing that turns noise into moving water. Two
     octaves of displacement, the second fed by the first. */
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p + 4.0 * r);

  /* The caustic itself: bands where the warped field crosses, sharpened so
     the bright lines read as focused light rather than as fog. */
  float band = abs(sin((f + r.x * 0.5) * 6.28318));
  float caustic = pow(1.0 - band, 9.0);
  caustic += pow(1.0 - abs(sin((f * 1.7 - r.y) * 6.28318)), 22.0) * 0.6;

  /* A slow, very low-frequency depth variation so the ground is not uniform
     underneath the highlights. */
  float depth = fbm(p * 0.35 + t * 0.2) * 0.14;

  vec3 col = uGround * (1.0 - depth);
  col = mix(col, uLight, clamp(caustic, 0.0, 1.0) * uIntensity);
  outColour = vec4(col, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function Caustics({
  ground, light, intensity = 0.55, scale = 3.2, staticSrc, className = "",
}: {
  /** The ground colour the light plays over. */
  ground: string;
  /** The highlight colour. */
  light: string;
  intensity?: number;
  scale?: number;
  /** One pre-rendered frame of this shader, for anything that cannot run it. */
  staticSrc?: string;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;

    /*
     * `preserveDrawingBuffer` costs a copy per frame, so it is off in normal
     * use. It is switched on only by the capture hook that renders the static
     * fallback: WebGL discards the drawing buffer after compositing, so
     * toDataURL on a live canvas returns a blank image and the fallback would
     * silently ship as an empty rectangle.
     *
     *   scripts/caustics-still.mjs sets the flag, loads the page, and saves the
     *   frame to public/brand/. Re-run it if the shader changes.
     */
    const capturing = Boolean((window as { __CAUSTICS_CAPTURE__?: boolean }).__CAUSTICS_CAPTURE__);
    const gl = el.getContext("webgl2", {
      antialias: false, alpha: false, powerPreference: "low-power",
      preserveDrawingBuffer: capturing,
    });
    if (!gl) { setFailed(true); return; }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };

    let program: WebGLProgram;
    try {
      program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const u = {
      res: gl.getUniformLocation(program, "uRes"),
      time: gl.getUniformLocation(program, "uTime"),
      ground: gl.getUniformLocation(program, "uGround"),
      light: gl.getUniformLocation(program, "uLight"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
      scale: gl.getUniformLocation(program, "uScale"),
    };
    gl.uniform3fv(u.ground, hexToRgb(ground));
    gl.uniform3fv(u.light, hexToRgb(light));
    gl.uniform1f(u.intensity, intensity);
    gl.uniform1f(u.scale, scale);

    /* Half resolution, capped. Caustics are all low-frequency light; nobody
       has ever noticed one was not rendered per-pixel, and the fill rate on a
       full-bleed ground at 2x is the whole cost of this effect. */
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(el.clientWidth * dpr * 0.5));
      const h = Math.max(1, Math.floor(el.clientHeight * dpr * 0.5));
      if (el.width !== w || el.height !== h) {
        el.width = w; el.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.res, w, h);
      }
    };

    const draw = (t: number) => {
      gl.uniform1f(u.time, t / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    size();
    draw(0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // One frame is the design. The movement is what was declined.

    let raf = 0;
    let running = false;
    const loop = (t: number) => { size(); draw(t); raf = requestAnimationFrame(loop); };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "120px" });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : io.takeRecords(), undefined);
    document.addEventListener("visibilitychange", onVis);
    const onResize = () => size();
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [ground, light, intensity, scale]);

  if (failed && staticSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={staticSrc} alt="" aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover ${className}`} />
    );
  }

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ background: ground }}
    />
  );
}
