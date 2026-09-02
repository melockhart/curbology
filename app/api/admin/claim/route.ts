import { handle, rpc } from "../../../../lib/admin-route";

/**
 * Bootstraps the first administrator.
 *
 * The route has no check of its own beyond being signed in, and does not need
 * one: `claim_admin()` refuses outright once any administrator exists, so this
 * cannot be replayed to escalate. The Account screen hides the button when the
 * claim would fail — that is a label on the door, not the lock.
 */
export async function POST(request: Request) {
  return handle(request, "/admin/account", async (_form, session) => {
    await rpc("claim_admin", {}, session);
  });
}
