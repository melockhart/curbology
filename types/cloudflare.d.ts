/**
 * The Workers runtime binding module.
 *
 * The parent repo gets this from wrangler's generated worker-configuration.d.ts,
 * which is not checked in here — it carries infrastructure identifiers, and the
 * house rule keeps those out of source control. Only the shape actually used is
 * declared.
 */
declare module "cloudflare:workers" {
  export const env: Record<string, string | undefined>;
}
