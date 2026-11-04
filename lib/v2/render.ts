import { siteContent } from "../cms";
import { configured } from "../env";
import { previewMode, previewReviews } from "../preview";
import { supabase } from "../service-db";
import { seoFor, siteSettings, type Review } from "../db";
import pagesJson from "./pages.generated.json";
import copyJson from "./copy.generated.json";

/**
 * The public site: the approved v2 screens, compiled from the design source into
 * data by site-port.cjs in curbology-canvas. Each page is one whole document with
 * desktop, tablet and phone trees that CSS switches between, so it deliberately
 * bypasses the old layouts and stylesheet.
 *
 * Tokens in the markup are filled per request: \u0001key\u0002 for copy and
 * \u0003slot\u0004 for images, both editable through the MCP server.
 */
type Page = { id: string; title: string; css: string; body: string };
const PAGES = pagesJson as Record<string, Page>;

const FONT = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Instrument+Sans:wght@400..700&display=swap";
const TITLE = "Curbology Exterior Cleaning";
const DAY = 86_400_000;

/** Stock photos stand in until Tristen's arrive, and a visitor should not take them for his work. */
const NOTICE_STYLE = "background:#0c2448;color:#fff;font:400 13px/1.4 'Instrument Sans',sans-serif;padding:6px 16px;text-align:center";

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const shortDate = (at: number) => new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Detroit" });

/** Which page a path shows. Terms and accessibility share the legal page until their text exists. */
const ALIAS: Record<string, string> = { "/terms": "/privacy", "/accessibility": "/privacy" };
export function hasPage(path: string): boolean {
  const clean = path.replace(/\/$/, "") || "/";
  const route = ALIAS[clean] ?? clean;
  return route !== "/404" && Boolean(PAGES[route === "/" ? "/" : `${route}/`]);
}

/* ---------------------------------------------------------------- reviews */

/** The approved rule: 3 to 5 stars post now, 1 and 2 stars after 48 hours, and every rating counts from day one. */
async function loadReviews(): Promise<Review[]> {
  if (previewMode()) return previewReviews;
  if (!configured()) return [];
  const response = await supabase("/rest/v1/reviews?select=*&order=created_at.desc&limit=200").catch(() => null);
  if (!response?.ok) return [];
  return (await response.json()) as Review[];
}

function stars(rating: number): string {
  return `<span class="stars" aria-label="${rating} out of 5">${"★".repeat(rating)}<span style="color:#b6c2cf">${"★".repeat(5 - rating)}</span></span>`;
}

function reviewCard(review: Review, now: number): string {
  const at = new Date(review.created_at).getTime();
  const waiting = review.rating <= 2 && now - at < 2 * DAY;
  const head = `<div class="row btw wr g8">${stars(review.rating)}`;
  if (waiting) {
    return `<article class="stack g12" style="padding:24px;border:1.5px dashed #8796a8;border-radius:16px;background:#e9eef2">${head}<span class="st warn">Being resolved</span></div><p class="lead">We received a ${review.rating} star review on ${shortDate(at)} and we are working on it with the customer. It posts here by ${shortDate(at + 2 * DAY)}, in the customer's words, with our reply beside it.</p><p class="hint">The rating already counts in the numbers above.</p></article>`;
  }
  const first = esc(review.name.trim().split(/\s+/)[0] ?? "");
  const reply = review.owner_reply
    ? `<div class="stack g4" style="border-left:3px solid #1890d0;padding-left:14px"><span class="lb">Tristen replied</span><p class="sm">${esc(review.owner_reply)}</p></div>`
    : "";
  return `<article class="card stack g12" style="padding:24px">${head}<span class="hint">${shortDate(at)}</span></div><p class="lead">${esc(review.body)}</p><p class="sm"><strong>${first}</strong> <span class="mut">${esc(review.service ?? "")}</span></p>${reply}</article>`;
}

function reviewParts(reviews: Review[], query: URLSearchParams, now: number) {
  const live = reviews.filter((review) => review.status !== "archived" && review.status !== "flagged");
  const counts = [5, 4, 3, 2, 1].map((n) => [n, live.filter((review) => review.rating === n).length] as const);
  const most = Math.max(1, ...counts.map(([, count]) => count));
  const hist = `<div class="stack g8">${counts
    .map(([n, count]) => `<div class="row g12"><span class="num sm" style="width:34px">${n} ★</span><span class="bar" style="width:${Math.round((count / most) * 120)}px;background:#0c2448"></span><span class="num sm">${count}</span></div>`)
    .join("")}</div>`;

  // Words show only with consent. The rating counts either way, as the form promises.
  const shown = live.filter((review) => review.consented || (review.rating <= 2 && now - new Date(review.created_at).getTime() < 2 * DAY));
  const wanted = Number(query.get("stars"));
  const replied = query.get("replied") === "1";
  const filtered = shown.filter((review) => (replied ? Boolean(review.owner_reply) : wanted >= 1 && wanted <= 5 ? review.rating === wanted : true));

  const link = (label: string, href: string, on: boolean) => `<a class="btn sm ${on ? "" : "alt"}" href="${href}">${label}</a>`;
  const nav = (dv: string) =>
    `<nav class="row g8 ${dv === "m" ? "" : "wr"}" aria-label="Filter reviews" style="margin-bottom:20px;${dv === "m" ? "overflow-x:auto;padding-bottom:6px" : ""}">${[
      link(`All ${shown.length}`, "/reviews", !wanted && !replied),
      ...[5, 4, 3, 2, 1].map((n) => link(`${n} ${n === 1 ? "star" : "stars"}`, `/reviews?stars=${n}`, wanted === n)),
      link("With a reply", "/reviews?replied=1", replied),
    ].join("")}</nav>`;

  const cards = filtered.map((review) => reviewCard(review, now)).join("");
  const empty = `<div class="card stack g8" style="padding:24px"><p class="lead">No reviews here yet.</p><p class="mut">When customers leave them, every rating shows here.</p></div>`;
  const list = (dv: string) =>
    `${nav(dv)}${cards ? `<div class="grid" style="grid-template-columns:${dv === "m" ? "1fr" : "1fr 1fr"};gap:16px;align-items:start">${cards}</div>` : empty}`;
  return { hist, list };
}

/* --------------------------------------------------------------- the page */

const STATE_NOTES: Record<string, string> = {
  preview: "Preview: the form works, but nothing is saved on this deployment.",
  missing: "Please fill in the required fields and try again.",
  failed: "That didn't send. Please try again, or call us.",
  unconfigured: "This form isn't switched on yet. Please call us.",
  ok: "Thanks. We have your request.",
};

export async function renderPage(path: string, request: Request, status = 200): Promise<Response> {
  const clean = path.replace(/\/$/, "") || "/";
  const route = ALIAS[clean] ?? clean;
  const page = PAGES[route === "/" ? "/" : `${route}/`] ?? PAGES["/404/"]!;
  const query = new URL(request.url).searchParams;
  const content = await siteContent();
  const copy = (content as unknown as { v2: Record<string, Record<string, string>> }).v2;
  const now = Date.now();

  const fill = (html: string) =>
    html
      .replace(/\u0001([^\u0002]+)\u0002/g, (_, key: string) => {
        const [scope, name] = key.split(".") as [string, string];
        return esc(copy[scope]?.[name] ?? (copyJson as Record<string, Record<string, string>>)[scope]?.[name] ?? "");
      })
      .replace(/\u0003([^\u0004]+)\u0004/g, (_, slot: string) => {
        const image = content.images[slot];
        return image ? image.url : `/v2/${slot}${slot === "logo" ? ".png" : ".jpg"}`;
      });

  let body = page.body;
  if (page.id === "reviews") {
    const { hist, list } = reviewParts(await loadReviews(), query, now);
    body = body.replace(/\u0005hist\u0006/g, hist).replace(/\u0005list\.(\w)\u0006/g, (_, dv: string) => list(dv));
  }
  if (page.id === "home") {
    // Only real reviews. With none yet, the section stands on its heading and links.
    const recent = (await loadReviews())
      .filter((review) => review.status !== "archived" && review.status !== "flagged" && review.consented)
      .filter((review) => review.rating >= 3 || now - new Date(review.created_at).getTime() >= 2 * DAY)
      .slice(0, 3);
    const fan = (dv: string) =>
      recent.length === 0
        ? ""
        : `<div class="fan">${recent
            .map((review) => {
              const reply = review.owner_reply ? `<div class="stack g4" style="border-left:3px solid #1890d0;padding-left:14px"><span class="lb">Tristen replied</span><p class="sm">${esc(review.owner_reply)}</p></div>` : "";
              return `<article class="card stack g12" style="padding:${dv === "d" ? 24 : 18}px;background:#fff">${stars(review.rating)}<p>${esc(review.body)}</p><p class="sm"><strong>${esc(review.name.trim().split(/\s+/)[0] ?? "")}</strong> <span class="mut">${esc(review.service ?? "")}</span></p>${reply}</article>`;
            })
            .join("")}</div>`;
    body = body.replace(/\u0005fan\.(\w)\u0006/g, (_, dv: string) => fan(dv));
  }
  if (body.includes("\u0005google")) {
    const settings = await siteSettings();
    const url = typeof settings["reviews.googleUrl"] === "string" ? (settings["reviews.googleUrl"] as string) : "";
    body = body.replace(/\u0005google([^\u0006]*)\u0006([\s\S]*?)\u0007/g, (_, style: string, inner: string) =>
      url ? `<a class="opt"${style} href="${esc(url)}" rel="noopener">${inner}</a>` : `<div class="opt"${style}>${inner}</div>`,
    );
  }
  const state = query.get("sent");
  const note = state && STATE_NOTES[state] ? `<p role="status" style="background:#e8f3fa;color:#0c2448;font:400 15px/1.4 'Instrument Sans',sans-serif;padding:12px 16px;text-align:center;margin:0">${STATE_NOTES[state]}</p>` : "";

  const override = await seoFor(clean).catch(() => null);
  const title = override?.title ?? (page.title.includes(TITLE) ? page.title : `${page.title} | ${TITLE}`);
  const description = override?.description ? `<meta name="description" content="${esc(override.description)}">` : "";
  const robots = override?.noindex ? '<meta name="robots" content="noindex">' : "";
  const logo = content.images.logo?.url ?? "/v2/logo.png";
  const notice = copy.shared?.placeholderPhotosNotCurbology ?? "";

  // Picks the page's own radio-style choices out of the form without any script.
  const forms = `.opt:has(input:checked){border:2px solid #0c2448;background:#e8f3fa}.opt:has(input:focus-visible){outline:3px solid #1890d0;outline-offset:2px}select.inp{appearance:auto}`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${robots}<title>${esc(title)}</title>${description}<link rel="icon" href="${esc(logo)}"><link rel="preconnect" href="https://fonts.gstatic.com"><link rel="stylesheet" href="${FONT.replace(/&/g, "&amp;")}"><style>${fill(page.css)}${forms}</style></head><body><div style="${NOTICE_STYLE}">${esc(notice)}</div>${note}${fill(body)}</body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
