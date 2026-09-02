import type { NextConfig } from "next";

/**
 * The opt-out route has two permanent aliases. Emails in the wild outlive any
 * decision to rename a route, so the old shapes have to keep working forever —
 * a 404 on an unsubscribe link is a spam complaint.
 */
const nextConfig: NextConfig = {
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
