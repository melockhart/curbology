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

export function allowedEmails(): Set<string> {
  return new Set(
    (runtimeEnv().ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}
