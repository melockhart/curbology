// Compiles the approved v2 site into the Curbology repo as data: page markup with
// tokens for copy and images, the copy dictionary, and the image files.
// Run after site.cjs: node site.cjs && node site-port.cjs
const fs = require('fs'), path = require('path');
const here = __dirname, site = here + '/site', repo = path.resolve(here, '../curbology');
const pagesAll = JSON.parse(fs.readFileSync(here + '/site-routes.json'));

// The quote flow, console, emails and sign-in stay as coded in the repo, because
// these screens hold sample data that would read as real.
const keep = ([r]) => !/^\/(quote|console|emails|sign-in|screens|email-unsubscribe)/.test(r);
const pages = pagesAll.filter(keep);
const SERVICE = ['pressure-washing', 'house-siding-washing', 'gutter-cleaning', 'roof-cleaning'];
const ID = { '/': 'home', '/services/': 'servicesIndex', '/services/pressure-washing/': 'servicePressure', '/services/house-siding-washing/': 'serviceSiding', '/services/gutter-cleaning/': 'serviceGutters', '/services/roof-cleaning/': 'serviceRoof', '/gallery/': 'gallery', '/reviews/': 'reviews', '/service-area/': 'serviceArea', '/about/': 'about', '/faq/': 'faq', '/contact/': 'contact', '/contact/sent/': 'contactSent', '/404/': 'notFound', '/privacy/': 'legal', '/menu/': 'menu', '/review/': 'review', '/review/thanks/': 'reviewThanks', '/review/thanks-low/': 'reviewThanksLow', '/review/platforms/': 'reviewPlatforms', '/testimonial/': 'testimonial', '/hub/': 'hub' };

const must = (s, re, to, label) => { const out = s.replace(re, to); if (out === s) throw new Error('no match: ' + label); return out; };
const FIELD = { 'Full name': 'name', 'Your name': 'name', 'Phone number': 'phone', Phone: 'phone', Email: 'email', Message: 'message', 'Your review': 'body', 'When suits you?': 'slots', 'Anything else?': 'notes' };
const REQUIRED = new Set(['name', 'email', 'body', 'slots']);
const named = (s) => s.replace(/<(input|textarea) aria-label="([^"]+)"/g, (m, tag, label) => FIELD[label] ? `<${tag} name="${FIELD[label]}"${REQUIRED.has(FIELD[label]) ? ' required' : ''} aria-label="${label}"` : m);
const submit = (s, text, to) => must(s, new RegExp(`<a class="([^"]*btn[^"]*)" href="${to}">(${text})</a>`, 'g'), '<button type="submit" class="$1">$2</button>', text);
const open = (action) => `<form action="${action}" method="post" style="display:contents">`;

function wire(route, tree, dv) {
  let t = tree;
  // Every address bar opens the real quote flow, carrying the address and service.
  t = t.replace(/<form class="qb" action="#"><input aria-label="Property address" placeholder="([^"]*)"><a class="btn" href="\/quote\/(?:\?service=(\d))?">([^<]*)<\/a><\/form>/g, (_, ph, n, label) =>
    `<form class="qb" action="/quote" method="get"><input name="address" aria-label="Property address" placeholder="${ph}">${n !== undefined ? `<input type="hidden" name="service" value="${SERVICE[+n]}">` : ''}<button type="submit" class="btn">${label}</button></form>`);
  t = t.replace(/href="\/quote\/\?service=(\d)"/g, (_, n) => `href="/quote?service=${SERVICE[+n]}"`);
  t = t.replace(/href="\/((?:[a-z0-9-]+\/)*[a-z0-9-]+)\/"/g, 'href="/$1"');

  if (route === '/contact/') {
    t = named(t);
    t = must(t, /<form class="([^"]*)" style="([^"]*)"><h2/, '<form class="$1" style="$2" action="/api/leads" method="post"><h2', 'contact form');
    t = submit(t, 'Send my message', '/contact/sent');
  }
  if (route === '/review/') {
    t = named(t);
    t = must(t, /<fieldset/, open('/api/reviews') + '<fieldset', 'review form');
    t = t.replace(/<a href="\/review\/thanks(?:-low)?" class="opt " style="([^"]*)"><span class="x h3 num">(\d)<\/span>(.*?)<\/a>/g,
      '<label class="opt" style="$1;cursor:pointer"><input type="radio" name="rating" value="$2" required style="position:absolute;opacity:0;width:1px;height:1px"><span class="x h3 num">$2</span>$3</label>');
    t = must(t, /<div class="inp sel"><span class="ph">Select a service<\/span>.*?<\/div>/s, '<select name="service" class="inp" aria-label="What did we do?"><option value="">Select a service</option><option>Pressure Washing</option><option>House &amp; Siding Soft Wash</option><option>Gutter Cleaning &amp; Brightening</option><option>Roof Cleaning</option></select>', 'review select');
    t = must(t, /<div class="chk"><span class="tog on" style="margin-top:2px"><\/span>(<span>You may publish.*?<\/span>)<\/div>/, '<label class="chk"><input type="checkbox" name="consent" value="yes" style="width:22px;height:22px;flex:none;margin:2px 0 0;accent-color:#0c2448">$1</label>', 'review consent');
    t = submit(t, 'Send my review', '/review/thanks');
    t = must(t, /(<p class="hint">Whatever you rate us[^<]*<\/p>)/, '$1</form>', 'review close');
  }
  if (route === '/testimonial/') {
    t = named(t);
    t = must(t, /<fieldset/, open('/api/bookings') + '<fieldset', 'testimonial form');
    const formats = ['in-person', 'self-record'];
    let n = 0;
    t = t.replace(/<a href="#" class="opt[^"]*">(<strong>.*?)<\/a>/g, (_, inner) => `<label class="opt" style="cursor:pointer"><input type="radio" name="format" value="${formats[n++]}" style="position:absolute;opacity:0;width:1px;height:1px">${inner}</label>`);
    t = must(t, /<a class="([^"]*btn[^"]*)" href="\/">Request a time<\/a>/, '<button type="submit" class="$1">Request a time</button></form>', 'testimonial submit');
  }
  if (route === '/review/thanks/' || route === '/review/thanks-low/') {
    // Sample names, stars and dates in the screens. The real page cannot know them.
    t = t.replace(/Thanks, Owen/g, 'Thanks').replace(/Thanks for telling us, Dana/g, 'Thanks for telling us').replace(/posts on our site by Nov 4/g, 'posts on our site within 48 hours');
    t = t.replace(/Your review is on our site now\. You can read it, and any reply from Tristen, on the reviews page\./g, 'Your rating counts now. If you said we could publish your words, you can read them on the reviews page, with any reply from Tristen.');
    t = t.replace(/<a class="(btn sm)" href="#">(?:(?!<\/a>).)*Yes, call me<\/a>/g, '<a class="$1" href="tel:+12483879215">Call us</a>').replace(/<a class="btn sm alt" href="#">(?:(?!<\/a>).)*No need<\/a>/g, '');
    t = t.replace(/<span class="stars"[^>]*>.*?<\/span><\/span>|<span class="stars"[^>]*>[^<]*<\/span>/s, '');
  }
  if (route.startsWith('/review/')) {
    // The Google link comes from settings. Until it exists this is text, not a dead link.
    t = t.replace(/<a class="opt"( style="[^"]*")? href="#">(<strong[^>]*>Google<\/strong>.*?)<\/a>/g, '\u0005google$1\u0006$2\u0007');
  }
  if (route === '/privacy/') {
    t = t.replace(/<a class="ni on" href="#">Privacy<\/a>/, '<a class="ni on" href="/privacy">Privacy</a>').replace(/<a class="ni" href="#">Terms<\/a>/, '<a class="ni" href="/terms">Terms</a>').replace(/<a class="ni" href="#">Accessibility<\/a>/, '<a class="ni" href="/accessibility">Accessibility</a>');
    t = t.replace(/The footer links here, and the page does not exist yet\. Text comes from Tristen or counsel\. Nothing is written in its place\./g, 'This page is being written. Until it is ready, ask us anything about how your details are used.');
  }
  if (route === '/') {
    t = must(t, / Sample reviews shown until real ones arrive\./, '', 'home sample line');
    t = must(t, /<div class="fan">.*?<\/article><\/div>(?=<\/div><\/section>)/s, `\u0005fan.${dv}\u0006`, 'home reviews');
  }
  if (route === '/reviews/') {
    t = must(t, / Sample reviews shown until real ones arrive\./, '', 'sample line');
    t = must(t, /<div class="stack g8"><div class="row g12"><span class="num sm" style="width:34px">5 ★.*?(<\/div><\/div>)(?=<\/div>)/s, `\u0005hist\u0006`, 'histogram');
    t = must(t, /<nav class="row g8[^"]*" aria-label="Filter reviews".*?(?=<\/div><\/section>)/s, `\u0005list.${dv}\u0006`, 'review list');
  }
  if (/href="#"/.test(t.replace(/<a class="opt"[^>]*href="#"/g, ''))) console.log('dead link left on', route, dv, t.match(/<a [^>]*href="#"[^>]*>[^<]*/)?.[0]);
  return t;
}

// ---- copy tokens. A string on three or more pages is one shared key.
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const parts = (html) => html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>|<option[\s\S]*?<\/option>|<[^>]+>|\u0005[^\u0006]*\u0006)/);
const isText = (p) => p && !p.startsWith('<') && !p.startsWith('\u0005') && /[A-Za-z0-9★]/.test(p);

const wired = {};
const seenOn = {};
for (const [route] of pages) {
  const doc = fs.readFileSync(site + route + 'index.html', 'utf8');
  const trees = {};
  for (const [dv, next] of [['d', '<div class="dv dv-t">'], ['t', '<div class="dv dv-m">'], ['m', '<script>']]) {
    const a = doc.indexOf(`<div class="dv dv-${dv}">`), b = doc.indexOf(next, a);
    trees[dv] = wire(route, doc.slice(a, b), dv);
  }
  const css = doc.slice(doc.indexOf('<style>') + 7, doc.indexOf('</style>'));
  const title = (doc.match(/<title>([^<]*)/) || [])[1] || '';
  wired[route] = { css, title, trees };
  const here_ = new Set();
  for (const html of Object.values(trees)) for (const p of parts(html)) if (isText(p)) here_.add(decode(p.trim()));
  for (const text of here_) (seenOn[text] = seenOn[text] || new Set()).add(route);
}

const copy = { shared: { placeholderPhotosNotCurbology: "Placeholder photos. These are not yet Curbology's own jobs." } };
const keyOf = {};
const slugFor = (scope, text) => {
  const base = text.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean).slice(0, 5).map((w, i) => i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join('') || 'text';
  const safe = /^\d/.test(base) ? 't' + base : base;
  let k = safe, n = 2;
  while (copy[scope][k] !== undefined && copy[scope][k] !== text) k = safe + n++;
  return k;
};
function tokenFor(route, text) {
  const scope = seenOn[text].size >= 3 ? 'shared' : ID[route];
  const memo = scope + '|' + text;
  if (!keyOf[memo]) {
    copy[scope] = copy[scope] || {};
    const k = slugFor(scope, text);
    copy[scope][k] = text;
    keyOf[memo] = `${scope}.${k}`;
  }
  return `\u0001${keyOf[memo]}\u0002`;
}
const images = {};
const out = {};
for (const [route, { css, title, trees }] of Object.entries(wired)) {
  const tokenised = {};
  for (const [dv, html] of Object.entries(trees)) {
    tokenised[dv] = parts(html).map((p) => {
      if (!isText(p)) return p.replace(/placeholder="([^"]+)"/, (m, ph) => {
        const text = decode(ph);
        if (!seenOn[text]) seenOn[text] = new Set([route, 'a', 'b']);
        return `placeholder="${tokenFor(route, text)}"`;
      });
      const lead = p.match(/^\s*/)[0], trail = p.match(/\s*$/)[0];
      return lead + tokenFor(route, decode(p.trim())) + trail;
    }).join('');
  }
  const body = tokenised.d + tokenised.t + tokenised.m;
  out[route] = { id: ID[route], title: title.replace(/ \| Curbology Exterior Cleaning$/, '').replace(/&amp;/g, '&'), css, body };
  for (const m of (css + body).matchAll(/\/a\/([\w.-]+)/g)) (images[m[1]] = images[m[1]] || new Set()).add(route.replace(/\/$/, '') || '/');
}
// Image references become tokens too, so a slot can be pointed at a real photo.
for (const page of Object.values(out)) {
  const swap = (s) => s.replace(/\/a\/([\w.-]+)/g, (_, f) => `\u0003${f.replace(/\.\w+$/, '')}\u0004`);
  page.css = swap(page.css); page.body = swap(page.body);
}
fs.mkdirSync(repo + '/lib/v2', { recursive: true });
fs.rmSync(repo + '/public/v2', { recursive: true, force: true });
fs.mkdirSync(repo + '/public/v2', { recursive: true });
const manifest = {};
for (const [file, routes] of Object.entries(images)) {
  fs.copyFileSync(`${here}/assets/${file}`, `${repo}/public/v2/${file}`);
  manifest[file.replace(/\.\w+$/, '')] = { file, usedOn: [...routes].slice(0, 6) };
}
fs.writeFileSync(repo + '/lib/v2/pages.generated.json', JSON.stringify(out));
fs.writeFileSync(repo + '/lib/v2/copy.generated.json', JSON.stringify(copy, null, 1));
fs.writeFileSync(repo + '/lib/v2/images.generated.json', JSON.stringify(manifest, null, 1));
const keys = Object.values(copy).reduce((n, c) => n + Object.keys(c).length, 0);
console.log(Object.keys(out).length, 'pages,', keys, 'copy keys,', Object.keys(manifest).length, 'images,', Math.round(JSON.stringify(out).length / 1024) + 'KB');
