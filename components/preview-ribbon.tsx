import { previewMode } from "../lib/preview";
import { A } from "./link";

/**
 * The one thing every preview page must carry.
 *
 * A console full of plausible names and a site full of finished copy is exactly
 * the sort of thing that gets screenshotted and forwarded without the sentence
 * that said it was a demo. So the sentence travels with the page.
 *
 * Fixed rather than a top bar: a bar would push the hero down and change the
 * fold, and the fold on the home page was measured deliberately.
 *
 * Bottom-RIGHT, because bottom-left sat exactly on top of the console sidebar's
 * Collapse and Sign out. A marker that covers a control is a bug you shipped on
 * purpose. Bottom-right is scrolling content in the console and the tail of the
 * footer on the site — and the footer gets clearance below for that reason.
 */
export function PreviewRibbon() {
  if (!previewMode()) return null;
  return (
    <A
      href="/preview"
      className="ground-teal fixed bottom-3 right-3 z-[60] flex items-center gap-2 rounded-full bg-teal px-3.5 py-2 text-xs font-medium text-ink shadow-lg print:hidden"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ink" />
      Preview — sample data, nothing saves
      <span className="underline underline-offset-2">All screens</span>
    </A>
  );
}
