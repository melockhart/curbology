import type { Metadata } from "next";
import { requireUser } from "../../lib/guard";
import { AdminShell } from "../../components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Console", template: "%s · Curbology Console" },
  robots: { index: false, follow: false },
};

/**
 * The auth gate, and the only place the console's chrome is mounted.
 *
 * Doing it here rather than in each screen means a new route cannot forget
 * either one: no page under /admin can render without having gone through
 * requireUser first, because the layout runs before it.
 *
 * Full-bleed exception: an editor surface that needs the whole viewport goes in
 * its own route group beside this one — a nested layout renders *inside* its
 * parent and cannot strip chrome, so there is no way to opt out from below.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  return (
    <AdminShell user={session.email} isGodMode={session.isGodMode}>
      {children}
    </AdminShell>
  );
}
