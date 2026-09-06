# Curbology Exterior Cleaning — Claude instructions

Tristen's business. This repository is the client's deliverable: the public site,
the admin console, three portals and the branded email shells.

The `/site-build` skill that produced it lives in `melockhart/design-library`.
That repository is the tool; this one is the work. Improvements to the *process*
belong there. Nothing here may depend on it.

## Non-negotiable rules

- **Never invent a fact.** No copy, contact detail, colour, review, count,
  photograph, address or URL that is not traceable to the capture in `capture/`
  or to something Tristen supplied. Make the build fail rather than emit a
  placeholder that reads as real. Five things were removed from the live site
  for exactly this reason; the README lists them and why.
- **Honest empty states.** Where a photograph or a link does not exist yet, the
  page says what it is waiting for. Never stock, never a dead icon.
- **Keep secrets and infrastructure identifiers out of source control.** Runtime
  config comes from the deploy target and locally from a gitignored `.dev.vars`.
  No account IDs, no project refs, no tokens — including in `wrangler.jsonc`.
- **Preview mode refuses to run when `SUPABASE_URL` is set.** That interlock in
  `lib/preview.ts` is what makes the demo session safe to exist. Do not weaken
  it, and do not add a second place that reads the flag.
- **Suppression never runs during SSR** on the unsubscribe route. Email security
  scanners fetch every URL in a message and would unsubscribe people who never
  clicked. POST only.
- **Contrast is computed, not asserted.** Every colour decision is checked with
  `npm run contrast`, and the sweep's blind spot is known: it cannot see
  backgrounds painted by pseudo-elements or fixed overlays, so it misses real
  failures behind them and invents ones in front. Compute those by hand.
- **⚖️ Opscend Design Law (2026-07-10): no capsule shapes.** Buttons and chips
  are 6–12px rects; eyebrows are flat mono kicker text; status labels are mono
  text plus a colour dot. Exempt: circular dots, avatars, window chrome.

## Checks — all four, after any code change

```
npm run build
npx tsc --noEmit
npm run lint
npm run contrast     # every text node on every route, against WCAG AA
```

`npm run contrast` sweeps the public site by default. For the console and the
preview index it needs a session and preview mode:

```
PREVIEW_MODE=1 PREVIEW_PASSWORD=<local> ADMIN_EMAILS=preview@opscend.net npm run start
CONTRAST_BASE=http://127.0.0.1:3000 CONTRAST_PREVIEW=1 \
CONTRAST_ADMIN_EMAIL=preview@opscend.net CONTRAST_ADMIN_PASSWORD=<local> npm run contrast
```

Current baseline: **2364 text elements across 42 routes, 0 below AA.** A change
that lowers the element count has removed something.

## Still blocked on the client

None of these is a code problem, and none is papered over — each has an honest
empty state in the build right now: real photography and video · confirmation
that `(248) 387-9215` is current · a registered postal address (CAN-SPAM, and
the commercial email lane is blocked on it) · a vector logo and a knockout
version for dark grounds · the Google review URL · Tristen's email for
`ADMIN_EMAILS`.
