import type { NextConfig } from "next";

/**
 * The opt-out route has two permanent aliases. Emails in the wild outlive any
 * decision to rename a route, so the old shapes have to keep working forever —
 * a 404 on an unsubscribe link is a spam complaint.
 */
const nextConfig: NextConfig = {
  // Next ignores folders that start with a dot, so OAuth discovery has to be rewritten to a normal path.
  async rewrites() {
    const server = "/api/oauth/metadata/authorization-server";
    const resource = "/api/oauth/metadata/protected-resource";
    return [
      { source: "/.well-known/oauth-authorization-server", destination: server },
      { source: "/.well-known/oauth-authorization-server/:path*", destination: server },
      { source: "/.well-known/oauth-protected-resource", destination: resource },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: resource },
    ];
  },
  async redirects() {
    return [
      { source: "/unsubscribe", destination: "/email-unsubscribe", permanent: true },
      { source: "/email-opt-out", destination: "/email-unsubscribe", permanent: true },
      // The live Wix site's portfolio path, so existing links and any indexed
      // pages land somewhere real rather than on the 404 above.
      { source: "/portfolio", destination: "/gallery", permanent: true },
    ];
  },
};

export default nextConfig;
