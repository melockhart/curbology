import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import "@fontsource-variable/archivo/wdth.css";
import "../../components/quote/quote.css";
import { configured } from "../../lib/env";
import { previewMode } from "../../lib/preview";
import { currentSession } from "../../lib/session";
import { supabase } from "../../lib/service-db";
import { age } from "../../components/admin/admin-ui";
import { CopyLine } from "./copy-line";

export const metadata: Metadata = { title: "Connections", robots: { index: false, follow: false } };

type Token = { id: string; name: string | null; created_at: string; client_id: string | null };
type McpSession = { token_id: string | null; client_name: string | null; last_seen_at: string; calls: number; tools: Record<string, number> };

/** Live connections, read from what the endpoint itself recorded at each handshake. */
async function connected() {
  const [tokens, sessions] = await Promise.all([
    supabase("/rest/v1/api_tokens?revoked_at=is.null&select=id,name,created_at,client_id&order=created_at.desc&limit=100"),
    supabase("/rest/v1/mcp_sessions?select=token_id,client_name,last_seen_at,calls,tools&order=last_seen_at.desc&limit=500"),
  ]);
  if (!tokens.ok || !sessions.ok) return null;
  const list = (await tokens.json()) as Token[];
  const seen = (await sessions.json()) as McpSession[];
  return list.map((token) => {
    const own = seen.filter((session) => session.token_id === token.id);
    const totals: Record<string, number> = {};
    for (const session of own) for (const [tool, count] of Object.entries(session.tools ?? {})) totals[tool] = (totals[tool] ?? 0) + count;
    return {
      id: token.id,
      name: own.find((session) => session.client_name)?.client_name ?? token.name ?? "Connection",
      calls: own.reduce((sum, session) => sum + session.calls, 0),
      lastSeen: own[0]?.last_seen_at ?? null,
      tools: Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tool]) => tool),
    };
  });
}

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const session = await currentSession();
  if (!session) redirect("/sign-in?redirect=/connections");
  const { s } = await searchParams;

  const head = await headers();
  const host = head.get("host") ?? "";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const mcpUrl = `${local ? "http" : "https"}://${host}/api/mcp`;
  const hasDatabase = configured() && !previewMode();
  const list = hasDatabase ? await connected() : [];

  return (
    <main className="qf qf-center">
      <div className="qf-grant qf-wide">
        <h1 className="qf-h-conn">Connections</h1>
        <p className="qf-conn-sub">Connect Claude to edit and run this site.</p>
        {s === "error" && <p className="qf-err" role="alert">That didn&apos;t disconnect. Try again.</p>}

        <p className="qf-conn-h">One click</p>
        {hasDatabase ? (
          <>
            <p className="qf-conn-p">In Claude: Settings, Connectors, Add custom connector. Paste this URL, click Connect, then press Allow.</p>
            <CopyLine value={mcpUrl} label="connector URL" />
          </>
        ) : (
          <p className="qf-conn-p">One-click connect needs the site&apos;s database, and this deployment doesn&apos;t have one yet.</p>
        )}

        <p className="qf-conn-h qf-mt">Command line</p>
        <CopyLine
          value={`claude mcp add --transport http curbology ${mcpUrl} --header "Authorization: Bearer $CURBOLOGY_MCP_TOKEN"`}
          label="command"
        />
        <p className="qf-conn-note">
          {hasDatabase
            ? "The token lives in ~/.opscend/curbology.env. It is never shown here."
            : "On this preview the token is the preview password. Copy and images can be read but not saved."}
        </p>

        <p className="qf-conn-h qf-mt">Connected</p>
        {list === null && <p className="qf-conn-p">The connections couldn&apos;t be read. Refresh to try again.</p>}
        {list?.length === 0 && <p className="qf-conn-p">Nothing is connected yet.</p>}
        {list?.map((item) => (
          <div className="qf-conn-row" key={item.id}>
            <div className="qf-kv qf-kv-top">
              <span className="qf-conn-who">
                <strong>{item.name}</strong>
                {item.tools.length > 0 && <span>{item.tools.join(", ")}</span>}
              </span>
              <span className="qf-conn-when">
                {item.calls} {item.calls === 1 ? "call" : "calls"}
                <br />
                {item.lastSeen ? `${age(item.lastSeen)} ago` : "Not used yet"}
              </span>
            </div>
            <form action="/api/connections/revoke" method="post">
              <input type="hidden" name="id" value={item.id} />
              <button className="qf-conn-off" aria-label={`Disconnect ${item.name}`}>Disconnect</button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
