"use client";

import { usePathname } from "next/navigation";
import { EntryLoader, RouteCover } from "./loader";

/**
 * Mounts the entry loader and route covers.
 *
 * A single client boundary at the top of the tree, so every page below it stays
 * a server component. The admin console does not mount this — motion there is
 * friction, not delight.
 */
export function MotionStage() {
  const pathname = usePathname();
  return (
    <>
      <EntryLoader />
      <RouteCover pathname={pathname} />
    </>
  );
}
