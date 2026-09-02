import { adminOnly, backWith } from "./admin-action";
import { rpc } from "./db";
import type { Session } from "./session";

/**
 * The shape every admin POST has: authenticate, read the form, call one RPC,
 * go back with a banner.
 *
 * The route's own `adminOnly` is the cheap check that keeps an anonymous POST
 * from reaching Supabase at all. It is not the check that matters — the RPC
 * re-checks the role in the database, where it cannot be skipped. Both, in that
 * order, because the first one is free and the second one is true.
 */
export async function handle(
  request: Request,
  back: string,
  run: (form: FormData, session: Session) => Promise<void> | void,
): Promise<Response> {
  const session = await adminOnly();
  if (session instanceof Response) return session;

  const form = await request.formData();
  try {
    await run(form, session);
  } catch (error) {
    return backWith(request, back, "error", error instanceof Error ? error.message : String(error));
  }
  return backWith(request, back, "saved");
}

export { rpc };
export type { Session };
