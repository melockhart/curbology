/*
 * Motion, and the homage.
 *
 * The Opscend/OpSite motion vocabulary is reverse-engineered from the
 * techniques behind motionsites.ai — techniques only; every figure, every
 * line of copy and every timing here is original to this build. The standard
 * asks that the inspiration be credited wherever the work ships, so it is
 * credited here and in the README rather than nowhere.
 */
"use client";

import { usePathname } from "next/navigation";
import { RouteCover } from "./loader";

/**
 * Mounts the route covers.
 *
 * The entry loader used to mount here too. It does not any more: the P-004
 * wordmark preloader in (site)/layout.tsx is the locked hard-block, and two
 * loading screens on one first paint is one loading screen too many. This was
 * shipping both.
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
      <RouteCover pathname={pathname} />
    </>
  );
}
