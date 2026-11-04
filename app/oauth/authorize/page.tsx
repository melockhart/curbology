import type { Metadata } from "next";
import { redirect } from "next/navigation";
import "@fontsource-variable/archivo/wdth.css";
import "../../../components/quote/quote.css";
import { configured } from "../../../lib/env";
import { previewMode } from "../../../lib/preview";
import { currentSession } from "../../../lib/session";
import { supabase } from "../../../lib/service-db";
import { Consent } from "./consent";

export const metadata: Metadata = { title: "Connect", robots: { index: false, follow: false } };

function Refusal({ title, body }: { title: string; body: string }) {
  return (
    <main className="qf qf-center">
      <div className="qf-grant">
        <p className="qf-kicker">Curbology console</p>
        <h1 className="qf-h-grant">{title}</h1>
        <p className="qf-grant-body">{body}</p>
      </div>
    </main>
  );
}

/**
 * The human gate. Registration is open, so a client only gets a code if a
 * signed-in admin says yes here. Without a session the whole request goes through
 * sign-in and comes back, so the client's flow survives the detour.
 */
export default async function AuthorizePage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw) ?? "";
  };

  if (previewMode() || !configured()) {
    return <Refusal title="Not available here" body="One-click connect needs the site's database, and this deployment doesn't have one yet." />;
  }

  const session = await currentSession();
  if (!session) {
    const query = new URLSearchParams(Object.keys(params).map((key) => [key, value(key)]));
    redirect(`/sign-in?redirect=${encodeURIComponent(`/oauth/authorize?${query.toString()}`)}`);
  }

  const clientId = value("client_id");
  const redirectUri = value("redirect_uri");
  const challenge = value("code_challenge");
  const method = value("code_challenge_method");
  const again = "Start the connection again from Claude.";

  if (!clientId || !redirectUri || !challenge) return <Refusal title="This link is incomplete" body={again} />;
  if (method && method !== "S256") return <Refusal title="This link isn't supported" body={again} />;

  const lookup = await supabase(`/rest/v1/oauth_clients?client_id=eq.${encodeURIComponent(clientId)}&select=client_name,redirect_uris&limit=1`);
  const [client] = lookup.ok ? ((await lookup.json()) as { client_name: string | null; redirect_uris: string[] }[]) : [];
  if (!client) return <Refusal title="This client isn't registered" body={again} />;
  // Unconditional and exact. This stops a code being delivered to anyone else.
  if (!client.redirect_uris?.includes(redirectUri)) {
    return <Refusal title="This address isn't registered" body={`That client asked to send you somewhere it didn't register, so it was refused. ${again}`} />;
  }

  return (
    <main className="qf qf-center">
      <Consent
        clientName={client.client_name || "This client"}
        email={session.email}
        request={{ clientId, redirectUri, challenge, state: value("state"), scope: value("scope"), resource: value("resource") }}
      />
    </main>
  );
}
