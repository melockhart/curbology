/**
 * Builds the hosted preview: one self-contained HTML file containing every
 * screen in the build.
 *
 * It does not re-implement anything. It drives the real app, waits for each
 * page to settle, and saves what the browser ended up with — so the preview is
 * the build's own output rather than a second version of it that can drift.
 *
 * What survives: every page, its real copy, the type, the palette, the layout at
 * any width (the CSS is intact, so the device toggle genuinely reflows), the
 * result of every scroll-triggered reveal, and the whole console.
 *
 * What does not: hover and scroll-linked motion, and the first-visit loader.
 * Those need the client bundle, and an ES-module graph cannot be inlined into a
 * single file without a second build step. The preview says so on its own face
 * rather than leaving someone to wonder why nothing moves.
 *
 *   node scripts/preview-bundle.mjs http://127.0.0.1:3330 <preview-password>
 */
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const PASSWORD = process.argv[3] ?? "";
const OUT = process.argv[4] ?? "preview.html";
const CHROME = process.env.CHROME_PATH || undefined;

/** The rail, and the crawl order. Grouped the way /preview groups it, because
 *  the point of both is that a third of the build is not in the nav. */
const SCREENS = [
  ["The site", [
    ["/", "Home", "Open hero, before/after, the pinned method"],
    ["/services", "Services", "The four the business sells"],
    ["/services/pressure-washing", "Pressure Washing", "One page per service"],
    ["/services/house-siding-washing", "House & Siding Soft Wash"],
    ["/services/gutter-cleaning", "Gutter Cleaning & Brightening"],
    ["/services/roof-cleaning", "Roof Cleaning", "Closes a gap the live site left open"],
    ["/about", "About", "No invented history"],
    ["/gallery", "Our work", "Honest empty states until there are photographs"],
    ["/reviews", "Reviews", "Only what was published from the console"],
    ["/service-area", "Service area"],
    ["/faq", "Questions & pricing"],
    ["/contact", "Get a free quote", "The conversion"],
    ["/contact?sent=preview", "Quote sent", "Where the form lands"],
  ]],
  ["Reached from elsewhere", [
    ["/hub", "Link-in-bio hub", "Instagram bio, truck decal, yard-sign QR"],
    ["/review", "Review portal", "Every rating takes the same path"],
    ["/review?sent=preview", "Review sent"],
    ["/testimonial", "Testimonial booking"],
    ["/testimonial?sent=preview", "Booking requested"],
    ["/email-unsubscribe?id=demo", "Unsubscribe", "POST only — rendering never suppresses"],
    ["/email-unsubscribe?id=demo&done=preview", "Unsubscribed"],
    ["/this-page-does-not-exist", "404", "The page nobody designs and everybody sees"],
    ["/preview", "Preview index", "The in-app index this viewer mirrors"],
  ]],
  ["The console", [
    ["/sign-in", "Sign in"],
    ["/admin", "Dashboard", "What is waiting on you today"],
    ["/admin/analytics", "Analytics", "Counted from its own tables, not page views"],
    ["/admin/activity", "Activity Log", "Written by the database, read-only"],
    ["/admin/leads", "Leads", "Oldest first — the one that costs money"],
    ["/admin/reviews", "Reviews", "Publish per review; nothing deletes"],
    ["/admin/bookings", "Bookings"],
    ["/admin/content", "Content"],
    ["/admin/forms", "Forms", "Form → endpoint → table → screen"],
    ["/admin/seo", "SEO & Redirects"],
    ["/admin/theme", "Theme", "Contrast computed on the page, not copied"],
    ["/admin/settings", "Settings"],
    ["/admin/team", "Team"],
    ["/admin/team-access", "Team Access"],
    ["/admin/users", "Users"],
    ["/admin/domain", "Domain", "Owner only — which vars are set, never their values"],
    ["/admin/account", "Account"],
  ]],
];

/** Where a form on screen X should land when someone presses its button here. */
const FORM_TARGETS = {
  "/api/leads": "/contact?sent=preview",
  "/api/reviews": "/review?sent=preview",
  "/api/bookings": "/testimonial?sent=preview",
  "/api/unsubscribe": "/email-unsubscribe?id=demo&done=preview",
  "/api/sign-in": "/admin",
  "/api/sign-out": "/sign-in",
};

const flat = SCREENS.flatMap(([, items]) => items);

/* ------------------------------------------------------------------ assets */

const dataUri = async (file, mime) =>
  `data:${mime};base64,${(await readFile(file)).toString("base64")}`;

function localFileFor(url) {
  const clean = url.split("?")[0];
  for (const root of ["dist/client", "public"]) {
    const candidate = path.join(root, clean.replace(/^\//, ""));
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const MIME = {
  ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".mp4": "video/mp4", ".ico": "image/x-icon",
};

/** Pull every url(/…) in the stylesheet in as a data URI, so the file needs no
 *  network at all. Fonts are the ones that matter: without them the whole page
 *  silently falls back and the type — which is most of the design — is gone. */
async function inlineCss(css) {
  const urls = [...new Set([...css.matchAll(/url\((\/[^)"']+)\)/g)].map((m) => m[1]))];
  for (const url of urls) {
    const file = localFileFor(url);
    if (!file) continue;
    const mime = MIME[path.extname(file)] ?? "application/octet-stream";
    css = css.split(`url(${url})`).join(`url(${await dataUri(file, mime)})`);
  }
  return css;
}

/* ------------------------------------------------------------------ capture */

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

if (PASSWORD) {
  await page.goto(`${BASE}/sign-in`);
  await page.fill('input[name="email"]', "preview@opscend.net");
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([page.waitForURL("**/admin"), page.click("form button")]);
}

let cssHref = null;
const captured = [];

for (const [route, label] of flat) {
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  // Let the reveals reveal and the loader finish. Capturing mid-animation is
  // how a preview ends up full of half-faded headings.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  const result = await page.evaluate(() => {
    /*
     * Settle the wash before serialising. The capture scrolls to the bottom and
     * back to make every reveal fire, which leaves the scrubbed sections
     * reading whatever scrollY 0 says — i.e. dirty. A still of the page
     * mid-transition is not the page; pin every section to its resolved state.
     */
    for (const section of document.querySelectorAll("[data-wash-section]")) {
      section.style.setProperty("--wash", "1");
      section.style.setProperty("--grime", "0");
    }
    /*
     * The caustics are a WebGL canvas and this file has no scripts, so the
     * canvas would serialise as an empty box over a flat fill — the preview
     * would show a different design from the site. Swap each one for the same
     * still the site itself falls back to; the image inliner downstream turns
     * it into a data URI like any other.
     */
    for (const c of document.querySelectorAll("canvas")) {
      const img = document.createElement("img");
      img.src = "/brand/caustics-deep.jpg";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.className = c.className;
      c.replaceWith(img);
    }
    const css = document.querySelector('link[rel="stylesheet"]')?.getAttribute("href") ?? null;
    for (const el of document.querySelectorAll("script, link, meta[http-equiv]")) el.remove();

    // Anchors become instructions for the viewer rather than navigations: an
    // iframe following a link would leave the harness behind.
    for (const a of document.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      if (!href) continue;
      if (href.startsWith("/")) { a.dataset.screen = href; a.removeAttribute("href"); a.setAttribute("role", "link"); a.setAttribute("tabindex", "0"); }
      else if (href.startsWith("#")) { /* in-page, leave it */ }
      else { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); }
    }
    for (const f of document.querySelectorAll("form[action]")) {
      f.dataset.action = f.getAttribute("action") ?? "";
      f.removeAttribute("action");
    }
    const imgs = [...document.querySelectorAll("img[src^='/']")].map((i) => i.getAttribute("src"));
    return {
      title: document.title,
      bodyClass: document.body.className,
      html: document.body.innerHTML,
      css,
      imgs: [...new Set(imgs)],
    };
  });

  cssHref ??= result.css;
  captured.push({ route, label, ...result });
  process.stdout.write(`  captured ${route}\n`);
}

await browser.close();

/* ------------------------------------------------------------------ assemble */

const rawCss = await readFile(localFileFor(cssHref), "utf8");
const css = await inlineCss(rawCss);

const images = new Map();
for (const shot of captured) {
  for (const src of shot.imgs) {
    if (images.has(src)) continue;
    const file = localFileFor(src);
    if (!file) continue;
    images.set(src, await dataUri(file, MIME[path.extname(file)] ?? "image/png"));
  }
}
for (const shot of captured) {
  for (const [src, uri] of images) shot.html = shot.html.split(`"${src}"`).join(`"${uri}"`);
  delete shot.imgs;
  delete shot.css;
}

const manifest = SCREENS.map(([group, items]) => [
  group,
  items.map(([route, label, note]) => ({ route, label, note: note ?? "" })),
]);
const pages = Object.fromEntries(captured.map((c) => [c.route, { title: c.title, bodyClass: c.bodyClass, html: c.html }]));

const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const template = await readFile("scripts/preview-shell.html", "utf8");

const out = template
  .replace("/*__CSS__*/", () => `\n${css}\n`)
  .replace("__MANIFEST__", () => json(manifest))
  .replace("__PAGES__", () => json(pages))
  .replace("__FORMS__", () => json(FORM_TARGETS));

await writeFile(OUT, out);
const kb = (Buffer.byteLength(out) / 1024).toFixed(0);
console.log(`\n${captured.length} screens → ${OUT} (${kb} KB, no network required)`);
