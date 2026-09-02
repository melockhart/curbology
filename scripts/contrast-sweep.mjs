/**
 * Walks every rendered text node on every route and checks its computed colour
 * against its effective background at WCAG AA.
 *
 * Two things this has to get right, both of which bit the first version:
 *   - Modern browsers serialise computed colours as oklab(), not rgb(). Reading
 *     the numbers out with a regex treats 0.999 as a red channel. A canvas 2D
 *     context normalises any CSS colour string to rgba, so use that.
 *   - Translucent text (text-white/60) must be composited over its background
 *     before measuring, or every faded caption reads as a failure.
 */
import { chromium } from "playwright";

const routes = ["/", "/services", "/services/pressure-washing", "/services/house-siding-washing",
  "/services/gutter-cleaning", "/services/roof-cleaning", "/about", "/contact", "/reviews",
  "/service-area", "/gallery", "/faq", "/hub", "/review", "/testimonial", "/email-unsubscribe?id=demo", "/nope-404"];

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
let fails = 0, checked = 0;

for (const route of routes) {
  await p.goto("http://localhost:3000" + route, { waitUntil: "networkidle" });
  const results = await p.evaluate(() => {
    /*
     * Chromium serialises computed colours as oklab() and its canvas 2D context
     * refuses to parse that back — fillStyle silently keeps its previous value,
     * so every translucent colour reads as black and every faded caption looks
     * like a contrast failure. Convert oklab to sRGB directly instead.
     */
    const srgb = (c) => { c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      return Math.max(0, Math.min(255, Math.round(c * 255))); };
    const oklabToRgb = (L, a, bb) => {
      const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
      const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
      const s = (L - 0.0894841775 * a - 1.2914855480 * bb) ** 3;
      return [
        srgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        srgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        srgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
      ];
    };
    const rgba = (css) => {
      if (!css || css === "transparent") return [0, 0, 0, 0];
      const nums = (css.match(/-?[\d.]+/g) || []).map(Number);
      if (css.startsWith("oklab(")) {
        const alpha = css.includes("/") ? nums[3] : 1;
        return [...oklabToRgb(nums[0], nums[1], nums[2]), alpha];
      }
      if (css.startsWith("rgb")) return [nums[0], nums[1], nums[2], nums.length > 3 ? nums[3] : 1];
      if (css.startsWith("#")) {
        const h = css.slice(1);
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 1];
      }
      return [0, 0, 0, 1];
    };
    const over = (fg, bg) => fg.slice(0,3).map((c,i) => Math.round(c * fg[3] + bg[i] * (1 - fg[3])));
    const lin = c => { c /= 255; return c <= 0.04045 ? c/12.92 : ((c+0.055)/1.055) ** 2.4; };
    const L = ([r,g,bl]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(bl);
    const ratio = (a, b) => { const [hi, lo] = [L(a), L(b)].sort((x,y) => y-x); return (hi+0.05)/(lo+0.05); };

    const bgOf = (el) => {
      let n = el, stack = [];
      while (n && n !== document.documentElement) {
        const c = rgba(getComputedStyle(n).backgroundColor);
        if (c[3] > 0) { stack.push(c); if (c[3] === 1) break; }
        n = n.parentElement;
      }
      let base = [255,255,255];
      for (const layer of stack.reverse()) base = over(layer, base);
      return base;
    };

    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const text = Array.from(el.childNodes).filter(n => n.nodeType === 3)
        .map(n => n.textContent.trim()).join(" ").trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none" || el.closest(".sr-only")) continue;
      const r0 = el.getBoundingClientRect();
      if (r0.width === 0 || r0.height === 0) continue;

      const bg = bgOf(el);
      const fg = over(rgba(cs.color), bg);
      const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      const r = ratio(fg, bg);
      out.push({ text: text.slice(0,45), r: +r.toFixed(2), need, size, pass: r >= need });
    }
    return out;
  });

  checked += results.length;
  const failing = results.filter(x => !x.pass);
  if (failing.length) {
    fails += failing.length;
    console.log(`\n✗ ${route}`);
    for (const f of failing) console.log(`    ${f.r} (need ${f.need}) ${f.size}px — "${f.text}"`);
  }
}

await b.close();
console.log(`\n${checked} text elements across ${routes.length} routes — ${fails} below WCAG AA`);
process.exit(fails > 0 ? 1 : 0);
