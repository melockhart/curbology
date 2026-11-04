import { handleMcp } from "../../../lib/mcp/server";
import { corsPreflight } from "../../../lib/mcp/oauth";

export const POST = handleMcp;
export function OPTIONS() {
  return corsPreflight();
}
// This server does not push messages, and clients treat 405 as "no stream".
export function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
export function DELETE() {
  return new Response(null, { status: 202 });
}
