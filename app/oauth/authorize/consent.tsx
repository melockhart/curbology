"use client";

import { useState } from "react";

export type ConsentRequest = {
  clientId: string; redirectUri: string; challenge: string; state: string; scope: string; resource: string;
};

export function Consent({ clientName, email, request }: { clientName: string; email: string; request: ConsentRequest }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const sendBack = (values: Record<string, string>) => {
    const url = new URL(request.redirectUri);
    for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
    if (request.state) url.searchParams.set("state", request.state);
    window.location.href = url.toString();
  };

  const allow = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/oauth/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as { code?: string };
      if (response.ok && body.code) return sendBack({ code: body.code });
      setError("That didn't connect. Start again from Claude.");
    } catch {
      setError("That didn't reach us. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div className="qf-grant">
      <p className="qf-kicker">Curbology console</p>
      <h1 className="qf-h-grant">Allow {clientName}?</h1>
      <p className="qf-grant-body">
        {clientName} will be able to edit site copy and images in drafts, publish them when you say so, take screenshots,
        and read and act on quotes, leads and reviews. It can&apos;t sign in as you anywhere else.
      </p>
      <div className="qf-kv"><span>Signed in as</span><strong>{email}</strong></div>
      <div className="qf-kv"><span>Sends you back to</span><strong>{new URL(request.redirectUri).host}</strong></div>
      {error && <p className="qf-err" role="alert">{error}</p>}
      <div className="qf-grant-actions">
        <button type="button" className="qf-btn alt" disabled={busy} onClick={() => sendBack({ error: "access_denied" })}>Deny</button>
        <button type="button" className="qf-btn" disabled={busy} onClick={allow}>{busy ? "Connecting" : "Allow"}</button>
      </div>
    </div>
  );
}
