/** Cloudflare Worker entry point for the Curbology site. */
import handler from "vinext/server/app-router-entry";

interface Env {
  /**
   * Static-asset binding, injected by the Cloudflare plugin. Declared inline
   * rather than pulled from wrangler's generated worker-configuration.d.ts,
   * which is not checked in — it carries infrastructure identifiers.
   */
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Supplied by the deploy target and locally by a gitignored .dev.vars. */
  SUPABASE_URL: string;
  SUPABASE_SECRET_KEY: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};

export default worker;
