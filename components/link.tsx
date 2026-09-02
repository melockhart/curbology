import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * One link component for the whole site.
 *
 * Internal paths get next/link — client-side navigation and prefetch, which a
 * bare <a> throws away. tel:, sms:, mailto:, in-page anchors and external URLs
 * stay as real anchors, because Link would be wrong for all of them.
 *
 * The alternative was importing Link in a dozen files and remembering which
 * hrefs are which. This does not require remembering.
 */
export function A({ href, ...rest }: ComponentProps<"a"> & { href: string }) {
  const internal = href.startsWith("/");
  if (internal) return <Link href={href} {...rest} />;
  return <a href={href} {...rest} />;
}
