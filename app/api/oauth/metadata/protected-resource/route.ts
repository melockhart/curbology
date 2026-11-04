import { corsPreflight, jsonResponse, originOf, protectedResourceMetadata } from "../../../../../lib/mcp/oauth";

/** RFC 9728 — the resource pointing at its authorization server. */
export async function GET(request: Request) {
  return jsonResponse(protectedResourceMetadata(originOf(request)));
}

export async function OPTIONS() {
  return corsPreflight();
}
