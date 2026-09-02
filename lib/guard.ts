import { redirect } from "next/navigation";
import { currentSession, type Session } from "./session";

/** Every admin page goes through this. */
export async function requireUser(): Promise<Session> {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  return session;
}
