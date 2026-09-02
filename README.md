# Curbology Exterior Cleaning — site

> **Staged here, not home.** This belongs in `melockhart/curbology`. Repository
> creation has been attempted twice and returns `403 Resource not accessible by
> integration` — the Claude GitHub App has read/write on the repositories it is
> granted, but not `Administration: write` on the account, which is what creating
> one needs. Nobody can fix that from inside a session.
>
> **To move it:** create an empty private `melockhart/curbology` on github.com
> (no README, no .gitignore — the first push carries everything), then grant the
> Claude GitHub App access to it. After that it is one push:
>
> ```
> cd clients/curbology
> git init && git add -A && git commit -m "Curbology — site, console, portals, email"
> git remote add origin https://github.com/melockhart/curbology.git
> git push -u origin main
> ```
>
> Nothing in this directory depends on living inside the design library.

Next 16 + vinext + Cloudflare Workers + Supabase, matching the design library's
posture. No IDs or secrets in source control.

## What is real and what is not

Every string in `lib/content.ts` is verbatim from the live Wix site, captured
2026-09-02 from the rendered DOM. Design tokens come from that DOM's `--wst-*`
semantic variables, not from sampling a screenshot.

Four things were **removed** rather than carried forward, each for a stated reason:

| Removed | Why |
| --- | --- |
| Stat band — 300+ / 3+ / 100% | No source. The client does not know where the numbers came from. |
| Footer address — 123 Exterior Way | Not a real address. |
| Footer email — hello@curbology.com | Wrong domain, never linked with `mailto:` anywhere in the DOM. |
| Footer phone — (517) 555-0123 | `555-01xx` is a reserved fictional range; 517 is Lansing, not Oakland County. |
| Six social icons | All six pointed at platform homepages, not profiles. |

`(248) 387-9215` is **provisional** — the client assumes it is current but has not
confirmed it. It carries a real `tel:` link on the live site, which is the only
evidence for it.

## Known naming conflict

The header badge reads **CURBOLOGY EXTERIOR SERVICES**. The copyright line and the
domain both say **Curbology Exterior Cleaning**. The badge is the canonical mark
(client's call); the text name follows the domain. Someone should reconcile these.

## Running it

```
npm install
npm run build
npm start
```

### Preview mode

There is no Supabase project yet, so the build ships a preview that serves the
whole thing — site, portals, email shells and all sixteen console screens — from
a fixed set of sample rows:

```
PREVIEW_MODE=1 PREVIEW_PASSWORD=<anything> npm start
```

Then `/preview` is an index of every screen in the build, and the console opens
with any email address plus that password.

**The interlock.** `previewMode()` in `lib/preview.ts` returns false whenever
`SUPABASE_URL` is set. That single check is what makes the preview sign-in safe
to exist: production has a database, therefore production is never in preview,
therefore the shortcut can never reach real customer data. Every other file asks
that function rather than reading the flag, so there is one place to get it
wrong and it is three lines long.

Everything the preview shows is **sample data** — not Curbology's customers,
reviews or bookings. Every page carries a ribbon saying so, and every write
reports that nothing was saved rather than implying it was.

### Checks

```
npm run build
npm run lint
npm run contrast     # every text node on every route, against WCAG AA
```

`npm run contrast` sweeps the public site by default. To include the console and
the preview index:

```
CONTRAST_BASE=http://127.0.0.1:3000 CONTRAST_PREVIEW=1 \
CONTRAST_ADMIN_EMAIL=preview@opscend.net CONTRAST_ADMIN_PASSWORD=<the password> \
  npm run contrast
```

## Still blocked on the client

None of these is a code problem, and none of them has been papered over with a
placeholder — each has an honest empty state in the build right now:

- Real photography and video. The gallery, the about page and the hero all say
  what they are waiting for.
- Confirmation that `(248) 387-9215` is current.
- A postal address, which is what the commercial email lane needs under CAN-SPAM.
  The transactional shell does not need one and is finished.
- A vector logo, and a knockout version for dark grounds.
- The Google review link — the portal shows it to everyone identically once
  `reviews.googleUrl` is set, and offers nothing rather than a wrong link now.
- Tristen's email address, for `ADMIN_EMAILS`.
