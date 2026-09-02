/**
 * Runtime configuration, from wherever it actually lives.
 *
 * On Cloudflare the bindings arrive through `cloudflare:workers`. That module
 * only exists inside the Workers runtime, and a static import of it makes the
 * app unstartable anywhere else — `vinext start`, a test runner, CI — with an
 * ERR_UNSUPPORTED_ESM_URL_SCHEME that looks nothing like a config problem.
 *
 * So it is imported dynamically and falls back to process.env. Production is
 * unchanged; everywhere else the app runs, which is what makes it verifiable.
 */
type RuntimeEnv = {
  SUPABASE_URL?: string;
  SUPABASE_SECRET_KEY?: string;
  /**
   * Comma-separated addresses allowed into the console.
   *
   * An env var rather than a constant because Tristen's address is not known
   * yet, and hardcoding a guess would either lock him out or — worse — let a
   * guessed address in.
   */
  ADMIN_EMAILS?: string;
  /**
   * The publishable key. Used only to accompany a *person's* access token on
   * the RPC calls that write — never the secret key, which would hand a
   * user-scoped request the power to bypass every policy it is being checked
   * against.
   */
  SUPABASE_PUBLISHABLE_KEY?: string;
  /**
   * God mode. A subset of ADMIN_EMAILS that additionally sees the items marked
   * `godModeOnly` and can claim the first admin role. Empty by default: nobody
   * gets it because a constant in the repo said so.
   */
  OWNER_EMAILS?: string;
  /** The hostname this deployment is meant to answer on. Diagnostics only. */
  SITE_HOST?: string;
};

let workersEnv: Record<string, string | undefined> | null = null;
try {
  ({ env: workersEnv } = (await import("cloudflare:workers")) as {
    env: Record<string, string | undefined>;
  });
} catch {
  workersEnv = null;
}

export function runtimeEnv(): RuntimeEnv {
  return (workersEnv ?? process.env) as RuntimeEnv;
}

/** Whether there is a database at all. Everything degrades honestly without one. */
export function configured(): boolean {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = runtimeEnv();
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
}

function emailSet(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function allowedEmails(): Set<string> {
  return emailSet(runtimeEnv().ADMIN_EMAILS);
}

/** God mode is an intersection, never a shortcut: an owner address that is not
 *  also on the admin allowlist does not get in at all. */
export function ownerEmails(): Set<string> {
  const admins = allowedEmails();
  return new Set([...emailSet(runtimeEnv().OWNER_EMAILS)].filter((e) => admins.has(e)));
}

/** Whether writes can happen. Reads work with the secret key alone; the RPC
 *  contract needs the publishable key too, and saying so here means the screens
 *  can explain it instead of failing at the first Save. */
export function writable(): boolean {
  return configured() && Boolean(runtimeEnv().SUPABASE_PUBLISHABLE_KEY);
}
