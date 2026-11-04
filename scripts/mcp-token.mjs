#!/usr/bin/env node
/**
 * Mints a long-lived MCP token for Claude Code and scripts.
 *
 *   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/mcp-token.mjs <admin-email> <user-id> "<name>"
 *
 * Prints the token once. Only its hash is stored, so it cannot be recovered.
 * The address must also be in ADMIN_EMAILS for the token to work.
 */
import { createHash, randomBytes } from "node:crypto";

const [email, ownerId, name = "Long-lived token"] = process.argv.slice(2);
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!email || !ownerId || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Usage: SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/mcp-token.mjs <admin-email> <user-id> [name]");
  process.exit(1);
}
const raw = `cb_${randomBytes(24).toString("hex")}`;
const response = await fetch(`${SUPABASE_URL}/rest/v1/curbology_api_tokens`, {
  method: "POST",
  headers: { apikey: SUPABASE_SECRET_KEY, Authorization: `Bearer ${SUPABASE_SECRET_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
  body: JSON.stringify({ owner_id: ownerId, owner_email: email.toLowerCase(), name, token_hash: createHash("sha256").update(raw).digest("hex"), token_prefix: raw.slice(0, 12) }),
});
if (!response.ok) {
  console.error(`Failed: ${response.status}`);
  process.exit(1);
}
console.log(raw);
