import { headers } from "next/headers";
import { safePath } from "./safe-path";
import { redirect } from "next/navigation";
import { currentSession, type Session } from "./session";

/** Every admin page goes through this. */
export async function requireUser(): Promise<Session> {
  const session = await currentSession();
  if (!session) {
    const asked = safePath((await headers()).get("x-curbology-path"));
    redirect(asked === "/admin" ? "/sign-in" : `/sign-in?redirect=${encodeURIComponent(asked)}`);
  }
  return session;
}
