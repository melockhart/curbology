import { authServerMetadata, corsPreflight, jsonResponse, originOf } from "../../../../../lib/mcp/oauth";

/** RFC 8414 — where the connector looks first. */
export async function GET(request: Request) {
  return jsonResponse(authServerMetadata(originOf(request)));
}

export async function OPTIONS() {
  return corsPreflight();
}
