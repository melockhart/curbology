#!/usr/bin/env node
/**
 * Curbology email shells.
 *
 * Three shells, split by what the message IS rather than only who it goes to:
 *
 *   client        external, commercial   — lockup, postal address, one opt-out
 *   transactional external, not commercial — lockup, no address, NO opt-out
 *   team          internal              — agent named, tabular well, neither
 *
 * The third one exists because Curbology has no postal address. CAN-SPAM's
 * address and opt-out requirements apply to messages whose primary purpose is
 * advertising or promotion (15 U.S.C. § 7704(a)(5)); transactional and
 * relationship messages are exempt. So quote replies, booking confirmations and
 * "we're coming Tuesday" can ship today, and only the marketing lane waits.
 *
 * ⚠️ A review request goes through the CLIENT shell, not this one. It sits close
 * enough to promotional that being wrong in the cautious direction costs nothing
 * and being wrong the other way is a violation.
 *
 * Usage:
 *   node scripts/email-shell.mjs --selftest
 *   node scripts/email-shell.mjs --build
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "email", "src");
const OUT = join(ROOT, "public", "email");

/**
 * Facts the build refuses to emit. Every one is a real string that shipped on
 * the live Wix site and is wrong — a fictional address, a reserved-fictional
 * phone number in the wrong area code, and an email on a domain the business
 * does not own. They are trivially copied back in from an authoritative-looking
 * source, so the build fails on them rather than trusting anyone to remember.
 */
const KNOWN_WRONG = [
  "123 Exterior Way",
  "(517) 555-0123",
  "517-555-0123",
  "hello@curbology.com",
];

const part = (name) => readFileSync(join(SRC, `${name}.html`), "utf8");

/* ------------------------------------------------------------------ */
/* normalizeBody — the step that matters                              */
/* ------------------------------------------------------------------ */

/**
 * Stored templates are almost never clean HTML. Dropped into a shell untouched
 * they arrive as a run-on paragraph, often with an opt-out the shell already
 * provides.
 */
export function normalizeBody(input) {
  let body = String(input ?? "");

  // 1. Strip any opt-out the body brought with it. The shell owns the opt-out.
  body = body.replace(/\{optOutLink\}/g, "");
  body = body.replace(
    /<p[^>]*>\s*(?:<a[^>]*>)?\s*(?:click here to\s*)?unsubscribe[\s\S]{0,180}?<\/p>/gi,
    "",
  );
  body = body.replace(/<a[^>]*>\s*unsubscribe\s*<\/a>/gi, "");

  const looksLikeHtml = /<(p|div|table|h[1-6]|ul|ol|br)\b/i.test(body);

  if (looksLikeHtml) {
    // 2. Real HTML passes through untouched — do not second-guess an agent that
    //    writes proper markup. Except for (3): newlines *inside* a <p> collapse,
    //    so a signature written as three lines arrives as one. Convert only
    //    newlines with text to their left; leave newlines between tags alone.
    return body.replace(/([^\s>])[ \t]*\n(?=[ \t]*[^\s<])/g, "$1<br />\n").trim();
  }

  // 4. Plain text becomes escaped paragraphs.
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const escaped = block
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />\n");
      return `<p style="margin:0 0 18px 0;">${escaped}</p>`;
    })
    .join("\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* renderShell                                                         */
/* ------------------------------------------------------------------ */

/**
 * Where the email's own assets live — the brand faces and the grain tile.
 *
 * Absolute by necessity: an email has no origin to resolve a relative URL
 * against. Overridable so a local preview can point at the dev server and
 * actually render in the real typeface; without that, every preview is checked
 * in the fallback stack and the design is never seen.
 */
export const ASSET_BASE = process.env.EMAIL_ASSET_BASE || "https://curbology.op-site.net";

export function renderShell({ shell, body, preheader, subject, contactId, postalAddress, agent, assetBase }) {
  if (!["client", "transactional", "team"].includes(shell)) {
    throw new Error(`Unknown shell: ${shell}`);
  }

  // Refusing is the feature. A commercial email without a real postal address is
  // not something to emit with a placeholder and fix later.
  if (shell === "client" && !postalAddress) {
    throw new Error(
      "renderShell: the client shell is commercial email and CAN-SPAM requires a valid " +
      "physical postal address. Curbology has none yet — use the transactional shell for " +
      "quote replies, confirmations and job notices, which are exempt.",
    );
  }

  const head = part("shell-head");
  const close = part("close");

  const pieces =
    shell === "team"
      ? [head, part("header-team"), part("body-open-team"), body, part("body-close"), part("footer-team"), close]
      : shell === "transactional"
        ? [head, part("header-client"), part("body-open"), body, part("body-close"), part("footer-transactional"), close]
        : [head, part("header-client"), part("body-open"), body, part("body-close"), part("footer-client"), close];

  let html = pieces.join("\n");

  /*
   * ⚠️ Replace GLOBALLY, always.
   *
   * Each shell documents its own tokens in a header comment, so the FIRST
   * {{preheader}} in the file is the documentation. A single-occurrence replace
   * substitutes the comment and ships the real token unreplaced. This bit three
   * separate times on earlier properties.
   */
  const slots = {
    preheader: preheader ?? "",
    subjectPreview: subject ?? preheader ?? "Curbology",
    contactId: contactId ?? "",
    postalAddress: postalAddress ?? "",
    agent: agent ?? "",
    assetBase: assetBase ?? ASSET_BASE,
  };
  for (const [key, value] of Object.entries(slots)) {
    html = html.replaceAll(`{{${key}}}`, String(value));
  }

  return html;
}

/* ------------------------------------------------------------------ */
/* Elements — what goes inside the well                                */
/* ------------------------------------------------------------------ */

const INK = "#1a202c";
const TEAL = "#04b8ba";
const MUTED = "#4a5568";

export const el = {
  /** A kicker with a rule over it — the editorial tell that a section started. */
  kicker: (t) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;"><tr><td>` +
    `<div style="width:44px;border-top:2px solid ${TEAL};font-size:1px;line-height:1px;">&nbsp;</div>` +
    `<div style="padding-top:10px;font-family:'Instrument Sans',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">${t}</div>` +
    `</td></tr></table>`,

  /** Display scale, tight leading — the same move the site's hero makes. */
  heading: (t) =>
    `<h1 class="h1 display" style="margin:0 0 18px 0;font-family:'Fraunces',Georgia,'Times New Roman',serif;font-size:36px;line-height:38px;font-weight:700;letter-spacing:-0.02em;color:${INK};">${t}</h1>`,

  subheading: (t) =>
    `<h2 class="display" style="margin:34px 0 14px 0;font-family:'Fraunces',Georgia,serif;font-size:23px;line-height:28px;font-weight:700;letter-spacing:-0.01em;color:${INK};">${t}</h2>`,

  text: (t) => `<p style="margin:0 0 20px 0;color:${INK};">${t}</p>`,

  lead: (t) =>
    `<p style="margin:0 0 24px 0;font-size:18px;line-height:29px;color:${INK};">${t}</p>`,

  quote: (t, who) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px 0;background:${TEAL};"><tr>` +
    `<td style="padding:26px 28px;">` +
    `<p class="display" style="margin:0 0 12px 0;font-family:'Fraunces',Georgia,serif;font-size:21px;line-height:30px;font-weight:700;color:${INK};">&ldquo;${t}&rdquo;</p>` +
    `<p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${INK};">${who}</p>` +
    `</td></tr></table>`,

  /*
   * The button.
   *
   * White on ink is 16.32:1. A gradient face and an inner top highlight give it
   * the same depth the site's buttons have; Outlook drops both and renders the
   * flat background-color, which is why that is set as well as the gradient.
   * Square corners in Outlook desktop are accepted rather than fought.
   */
  button: (label, href) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 26px 0;"><tr>` +
    `<td align="center" bgcolor="${INK}" style="background:${INK};background-image:linear-gradient(180deg,#262f42 0%,#1a202c 62%,#12161f 100%);border-radius:999px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.14);">` +
    `<a href="${href}" style="display:inline-block;padding:16px 34px;font-family:'Instrument Sans',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.01em;color:#ffffff;text-decoration:none;">${label}&nbsp;&rarr;</a>` +
    `</td></tr></table>`,

  rule: () =>
    `<div style="border-top:1px solid #dfe4ea;font-size:1px;line-height:1px;margin:30px 0;">&nbsp;</div>`,
  spacer: (h = 20) => `<div style="height:${h}px;line-height:${h}px;">&nbsp;</div>`,

  /** A service, as Curbology sells it. The arrow is a glyph, so it survives
   *  image blocking where an icon would not. */
  serviceCard: ({ name, blurb, href }) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;background:${TEAL};"><tr>` +
    `<td style="padding:26px 28px;">` +
    `<p class="display" style="margin:0 0 8px 0;font-family:'Fraunces',Georgia,serif;font-size:21px;line-height:26px;font-weight:700;letter-spacing:-0.01em;color:${INK};">${name}</p>` +
    `<p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:${INK};">${blurb}</p>` +
    `<a href="${href}" style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${INK};text-decoration:none;border-bottom:2px solid ${INK};padding-bottom:2px;">See what&rsquo;s included &rarr;</a>` +
    `</td></tr></table>`,

  /**
   * Before and after. Email cannot do a drag slider, so it is two plates with
   * their labels set as captions beneath. Every slot has an honest empty state
   * — never a broken image, never stock. On this business the photograph is the
   * argument, so a missing one is worth naming rather than papering over.
   */
  beforeAfter: ({ before, after, caption }) => {
    const plate = (src, label) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
      `<tr><td>` +
      (src
        ? `<img src="${src}" alt="${label}" width="258" style="display:block;width:100%;max-width:258px;height:auto;" />`
        : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;border:1px solid #dfe4ea;"><tr>` +
          `<td align="center" style="padding:46px 12px;font-size:12px;line-height:18px;color:#8b95a3;">Photography<br />to come</td></tr></table>`) +
      `</td></tr>` +
      `<tr><td style="padding-top:8px;font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">${label}</td></tr>` +
      `</table>`;
    return (
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 0 0;"><tr>` +
      `<td class="stack" width="50%" valign="top" style="padding-right:9px;">${plate(before, "Before")}</td>` +
      `<td class="stack" width="50%" valign="top" style="padding-left:9px;">${plate(after, "After")}</td>` +
      `</tr></table>` +
      (caption ? `<p style="margin:14px 0 26px 0;font-size:13px;line-height:20px;color:${MUTED};">${caption}</p>` : el.spacer(26))
    );
  },

  /** A quote, itemised. Amounts render as given — never computed here, because
   *  Number() over a merge token produces NaN in every template. */
  quoteEstimate: ({ lines, total, note }) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px 0;">` +
    `<tr><td colspan="2" style="background:${INK};padding:13px 20px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">The quote</td></tr>` +
    lines
      .map(
        (l) =>
          `<tr><td style="padding:15px 20px;border-bottom:1px solid #e6eaef;font-size:15px;color:${INK};">${l.label}</td>` +
          `<td align="right" style="padding:15px 20px;border-bottom:1px solid #e6eaef;font-size:15px;color:${INK};white-space:nowrap;">${l.amount}</td></tr>`,
      )
      .join("") +
    `<tr><td style="padding:18px 20px;background:${TEAL};font-family:'Fraunces',Georgia,serif;font-size:17px;font-weight:700;color:${INK};">Total</td>` +
    `<td align="right" style="padding:18px 20px;background:${TEAL};font-family:'Fraunces',Georgia,serif;font-size:20px;font-weight:700;color:${INK};white-space:nowrap;">${total}</td></tr>` +
    `</table>` +
    (note ? `<p style="margin:0 0 22px 0;font-size:13px;line-height:20px;color:${MUTED};">${note}</p>` : ""),
};

/* ------------------------------------------------------------------ */
/* Guards                                                              */
/* ------------------------------------------------------------------ */

/**
 * Counts the opt-out the way a reader sees it.
 *
 * ⚠️ Counting the word finds it in the href too — a correct client email
 * contains "unsubscribe" twice. Count anchor TEXT.
 */
export function visibleUnsubscribes(html) {
  const anchors = html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) ?? [];
  return anchors.filter((a) => /unsubscribe|opt[- ]?out/i.test(a.replace(/<[^>]+>/g, ""))).length;
}

export function guard(name, html, shell) {
  const problems = [];

  const leftovers = html.match(/\{\{[a-zA-Z0-9_]+\}\}/g);
  if (leftovers) problems.push(`unreplaced token(s): ${[...new Set(leftovers)].join(", ")}`);

  if (/\{optOutLink\}/.test(html)) problems.push("legacy {optOutLink} survived");

  const seen = visibleUnsubscribes(html);
  if (shell === "client" && seen !== 1) problems.push(`client email has ${seen} visible unsubscribe(s), expected exactly 1`);
  if (shell === "transactional" && seen !== 0) problems.push("transactional email carries an unsubscribe — it is not commercial email");
  if (shell === "team" && seen !== 0) problems.push("team email carries an unsubscribe");

  if (shell === "client") {
    if (!/Unsubscribe/.test(html)) problems.push("client email has no opt-out");
    const footer = html.slice(html.lastIndexOf("Exterior cleaning across"));
    if (/\[.*address.*\]/i.test(footer)) problems.push("client email still carries an address placeholder");
  }
  if (shell !== "client" && /email-unsubscribe/.test(html)) {
    problems.push(`${shell} email links to the opt-out route`);
  }

  for (const wrong of KNOWN_WRONG) {
    if (html.includes(wrong)) problems.push(`contains a known-wrong fact: ${wrong}`);
  }

  return problems.map((p) => `${name}: ${p}`);
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const SAMPLE_HTML = `<p>Hi {firstName},</p><p>Your driveway is booked for {jobDate}.
Anything you want us to look at while we are there, just reply.</p>`;
const SAMPLE_TEXT = `Hi {firstName},

Thanks for getting in touch. Here is the quote for {serviceName}.
Tristen
Curbology`;

function selftest() {
  const checks = [];
  const ok = (label, condition) => checks.push({ label, pass: Boolean(condition) });

  // normalizeBody
  ok("plain text becomes paragraphs", normalizeBody(SAMPLE_TEXT).startsWith("<p"));
  ok("plain text keeps single-brace CRM tokens", normalizeBody(SAMPLE_TEXT).includes("{firstName}"));
  ok("signature lines survive as <br>", normalizeBody(SAMPLE_TEXT).includes("Tristen<br />"));
  ok("real HTML passes through", normalizeBody("<p>Hi</p>") === "<p>Hi</p>");
  ok("newline inside <p> is repaired", normalizeBody(SAMPLE_HTML).includes("<br />"));
  ok("newline between tags is left alone", !normalizeBody("<p>a</p>\n<p>b</p>").includes("<br />"));
  ok("legacy {optOutLink} stripped", !normalizeBody("<p>x</p>{optOutLink}").includes("optOutLink"));
  ok("body-borne unsubscribe anchor stripped",
    !/unsubscribe/i.test(normalizeBody(`<p>x</p><a href="#">Unsubscribe</a>`)));
  ok("html is escaped in plain text", normalizeBody("5 < 6 & 7").includes("&lt;"));

  // renderShell
  ok("client shell throws without a postal address", (() => {
    try { renderShell({ shell: "client", body: "<p>x</p>", contactId: "1" }); return false; }
    catch { return true; }
  })());
  ok("transactional shell renders without an address", (() => {
    try { renderShell({ shell: "transactional", body: "<p>x</p>" }); return true; } catch { return false; }
  })());
  ok("unknown shell throws", (() => {
    try { renderShell({ shell: "nope", body: "" }); return false; } catch { return true; }
  })());

  const client = renderShell({
    shell: "client", body: normalizeBody(SAMPLE_TEXT), preheader: "Your quote",
    contactId: "abc123", postalAddress: "1 Example St, Somewhere, MI 48000",
  });
  ok("every {{token}} replaced, not just the first", !/\{\{[a-z]/i.test(client));
  ok("client has exactly one visible unsubscribe", visibleUnsubscribes(client) === 1);
  ok("the word 'unsubscribe' appears twice — anchor plus href",
    (client.match(/unsubscribe/gi) ?? []).length === 2);

  const transactional = renderShell({ shell: "transactional", body: "<p>Booked.</p>", preheader: "Booked" });
  ok("transactional carries no opt-out", visibleUnsubscribes(transactional) === 0);
  ok("transactional does not link the opt-out route", !/email-unsubscribe/.test(transactional));

  const team = renderShell({ shell: "team", body: "<p>3 new leads.</p>", agent: "CSA", preheader: "Rollup" });
  ok("team names the sending agent", team.includes("CSA"));
  ok("team carries no opt-out", visibleUnsubscribes(team) === 0);

  // Guards
  ok("guard catches a known-wrong fact",
    guard("t", renderShell({ shell: "transactional", body: "<p>call (517) 555-0123</p>" }), "transactional").length > 0);
  ok("guard catches an unreplaced token", guard("t", "<p>{{preheader}}</p>", "team").length > 0);
  ok("a correct client email passes its guards", guard("c", client, "client").length === 0);
  ok("a correct transactional email passes its guards", guard("t", transactional, "transactional").length === 0);
  ok("a correct team email passes its guards", guard("m", team, "team").length === 0);

  for (const c of checks) console.log(`${c.pass ? "  ok  " : "  FAIL"}  ${c.label}`);
  const failed = checks.filter((c) => !c.pass).length;
  console.log(`\n${checks.length - failed}/${checks.length} assertions passing`);
  return failed === 0;
}

function build() {
  mkdirSync(OUT, { recursive: true });
  const problems = [];
  const written = [];

  const write = (name, html, shell) => {
    problems.push(...guard(name, html, shell));
    writeFileSync(join(OUT, name), html);
    // Extensionless twin: Pages 308-redirects /client.html to /client, and an
    // HTTP client that does not follow redirects gets a 308 and no body.
    writeFileSync(join(OUT, name.replace(/\.html$/, "")), html);
    written.push(name);
  };

  const WELL = `<div style="border:2px dashed #b9c2ce;padding:26px;text-align:center;color:${MUTED};font-size:14px;line-height:21px;">
  <strong style="color:${INK};">The Well</strong><br />
  This is where the body goes. Delete this outline and write in its place.<br />
  Everything around it is already branded, compliant and correct.
</div>`;

  const ADDRESS_FOR_PREVIEW = "1 Example Street, Somewhere, MI 48000";

  // Wells — the blanks. Never ship a truly-empty variant: it renders as chrome
  // around a void and teaches nobody where content goes.
  write("client-well.html", renderShell({ shell: "client", body: WELL, preheader: "Preheader text", contactId: "{contactId}", postalAddress: ADDRESS_FOR_PREVIEW }), "client");
  write("transactional-well.html", renderShell({ shell: "transactional", body: WELL, preheader: "Preheader text" }), "transactional");
  write("team-well.html", renderShell({ shell: "team", body: WELL, preheader: "Preheader text", agent: "AGENT" }), "team");

  // Previews — a real message, rendered end to end. A unit test says the
  // normalizer behaves; only a rendered email says it works.
  const quoteBody = [
    el.kicker("Your quote"),
    el.heading("Driveway and walkway, {propertyAddress}"),
    el.text("Thanks for the photos — they were enough to price it without visiting."),
    el.quoteEstimate({
      lines: [{ label: "Driveway pressure washing", amount: "{driveway}" }, { label: "Front walkway", amount: "{walkway}" }],
      total: "{total}",
      note: "Held for 30 days. If we find something the photos did not show, we will call before starting.",
    }),
    el.button("Book this in", "https://curbology.op-site.net/contact"),
    el.beforeAfter({ caption: "A driveway we cleaned in West Bloomfield." }),
  ].join("\n");

  write("client-preview.html", renderShell({ shell: "client", body: quoteBody, preheader: "Your quote for {propertyAddress}", contactId: "{contactId}", postalAddress: ADDRESS_FOR_PREVIEW }), "client");
  write("transactional-preview.html", renderShell({
    shell: "transactional",
    body: [
      el.kicker("Confirmed"),
      el.heading("We're coming {jobDate}"),
      el.text("Hi {firstName} — you're booked in for {serviceName} at {propertyAddress}."),
      el.text("You don't need to be home. If anything changes, reply to this email or call us."),
      el.rule(),
      el.text("Anything you'd like us to look at while we're there? Just reply."),
    ].join("\n"),
    preheader: "You're booked for {jobDate}",
  }), "transactional");
  write("team-preview.html", renderShell({
    shell: "team",
    body: [
      el.heading("Overnight: 3 new leads"),
      el.text("Two quote requests with photos, one testimonial booking."),
      el.rule(),
      el.text("Oldest unanswered: 19 hours."),
    ].join("\n"),
    preheader: "Overnight rollup",
    agent: "CSA",
  }), "team");

  // compose.html — the composable blank. A client artifact NOT named client-*,
  // which is exactly how it got checked against the team rules once and failed
  // for carrying a link it is supposed to carry.
  write("compose.html", renderShell({
    shell: "client",
    body: [el.kicker("Kicker"), el.heading("Heading"), el.text("Body copy."), el.button("Call to action", "https://curbology.op-site.net/contact")].join("\n"),
    preheader: "Preheader text", contactId: "{contactId}", postalAddress: ADDRESS_FOR_PREVIEW,
  }), "client");

  // elements.html — the palette, each element beside the call that produces it.
  const demos = [
    ["el.kicker('Your quote')", el.kicker("Your quote")],
    ["el.heading('Heading')", el.heading("Heading")],
    ["el.text('Body copy.')", el.text("Body copy.")],
    ["el.quote('…', 'Name')", el.quote("They left the driveway looking new.", "A customer, West Bloomfield")],
    ["el.button('Label', href)", el.button("Get a free quote", "https://curbology.op-site.net/contact")],
    ["el.rule()", el.rule()],
    ["el.serviceCard({…})", el.serviceCard({ name: "Gutter Cleaning & Brightening", blurb: "Removes tiger stripes and oxidation, not just debris.", href: "https://curbology.op-site.net/services/gutter-cleaning" })],
    ["el.beforeAfter({…})", el.beforeAfter({ caption: "Empty state — never stock, never a broken image." })],
    ["el.quoteEstimate({…})", el.quoteEstimate({ lines: [{ label: "Driveway", amount: "$180" }], total: "$180" })],
  ];
  write("elements.html", renderShell({
    shell: "transactional",
    body: demos.map(([call, html]) =>
      `<p style="margin:26px 0 8px 0;font-family:Menlo,Consolas,monospace;font-size:12px;color:${MUTED};">${call.replace(/</g, "&lt;")}</p>${html}`).join("\n"),
    preheader: "Curbology email elements",
  }), "transactional");

  /*
   * No index.html and no agent.txt here.
   *
   * /email is a real Next page — a generated index.html left /email itself 404ing,
   * and only /email/index.html resolved, which is not a URL anyone pastes into a
   * contract. agent.txt is a route handler, because a static asset was typed from
   * its extension as application/octet-stream and the contract requires
   * text/plain. Both live under app/(bare)/email/.
   */

  if (problems.length) {
    console.error("\nBuild refused — the artifacts were written but are not shippable:\n");
    for (const p of problems) console.error(`  ✗ ${p}`);
    return false;
  }
  console.log(`Wrote ${written.length} artifacts plus extensionless twins to public/email/. The index and agent.txt are Next routes under app/(bare)/email/.`);
  return true;
}

const flag = process.argv[2];
if (flag === "--selftest") process.exit(selftest() ? 0 : 1);
else if (flag === "--build") process.exit(build() ? 0 : 1);
else {
  console.log("usage: email-shell.mjs --selftest | --build");
  process.exit(1);
}
