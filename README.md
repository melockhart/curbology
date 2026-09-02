# Curbology Exterior Cleaning — site

> **Staged here, not home.** This belongs in `melockhart/curbology`. The build
> session's GitHub app returned `403 Resource not accessible by integration` on
> repository creation, and losing the work to a reclaimed container was the worse
> option. Move this directory to its own repo when one exists; nothing in it
> depends on living inside the design library.

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
