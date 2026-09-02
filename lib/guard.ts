import { redirect } from "next/navigation";
import { currentUser } from "./session";

/** Every admin page and every admin action goes through this. */
export async function requireUser(): Promise<string> {
  const email = await currentUser();
  if (!email) redirect("/sign-in");
  return email;
}
