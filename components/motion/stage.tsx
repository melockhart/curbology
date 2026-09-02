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

  /*
   * The console and the sign-in page get no loader and no route covers.
   * Motion in a tool someone opens every morning is friction, not delight —
   * and a splash between "leads" and "reviews" is just a delay.
   */
  if (pathname === "/sign-in" || pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  return (
    <>
      <EntryLoader />
      <RouteCover pathname={pathname} />
    </>
  );
}
