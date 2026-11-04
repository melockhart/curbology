import { configured, runtimeEnv } from "../env";
import { previewMode } from "../preview";

export function reply(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * The answer when there is nowhere to save a quote, or null when there is. Preview
 * mode says so plainly, so the screens can walk through without implying a save.
 */
export function notReady(): Response | null {
  if (previewMode()) return reply({ status: "preview" });
  if (!configured() || !runtimeEnv().QUOTE_HASH_SALT) return reply({ status: "unconfigured" }, 503);
  return null;
}

export function quoteToken(request: Request): string {
  return request.headers.get("x-quote-token") ?? "";
}
