import agent from "../../../../email/src/agent.txt?raw";

/**
 * The agent contract, served as real text/plain.
 *
 * It has to be a route rather than a file in public/: static assets are typed
 * from their extension by the host, and this one came back as
 * application/octet-stream — which an agent fetching it would have to guess at.
 * "Use the HTML shell" is not actionable on its own; this URL is the whole
 * instruction, so it has to arrive readable.
 */
export function GET() {
  return new Response(agent, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
