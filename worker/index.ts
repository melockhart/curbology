/** Cloudflare Worker entry point for the Curbology site. */
import handler from "vinext/server/app-router-entry";
import { previewMode } from "../lib/preview";

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
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);

    /*
     * A preview deployment is not indexable. Ever.
     *
     * Individual routes set their own robots metadata, and the console and the
     * portals already do — but a preview serves the whole public site too, and
     * relying on every page to remember is how one of them does not. This is
     * the header, at the edge, on every response, so there is nothing to
     * forget and nothing to keep in step.
     *
     * previewMode() rather than reading the flag here: it refuses to return
     * true when SUPABASE_URL is set, so production can never accidentally
     * serve a noindex header, and the interlock stays defined in one place.
     */
    // A browser previewing a draft must never have it cached or indexed.
    if ((request.headers.get("cookie") ?? "").includes("curbology_draft=")) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "private, no-store");
      headers.set("X-Robots-Tag", "noindex, nofollow");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    if (!previewMode()) return response;
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

export default worker;
