import { notReady, quoteToken, reply } from "../../../lib/quote/http";
import { publicQuote } from "../../../lib/quote/rules";
import { checkAddress, createQuote, hashIp, loadQuote, newToken, sha256, underStartLimit } from "../../../lib/quote/store";

/**
 * Step one: the address box. Starts a quote and hands back the token that is
 * the customer's only key to it. An address outside the area still starts one,
 * because the owner decides what is too far, and the customer can leave details.
 */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;

  const body = (await request.json().catch(() => null)) as { address?: unknown; service?: unknown } | null;
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  if (address.length < 5 || address.length > 300) return reply({ error: "Please check the address." }, 400);
  const service = typeof body?.service === "string" ? body.service.trim().slice(0, 80) || null : null;

  try {
    const ipHash = await hashIp(request.headers.get("cf-connecting-ip") ?? "unknown");
    if (!(await underStartLimit(ipHash))) return reply({ error: "Too many quotes from here. Please try later." }, 429);

    const check = await checkAddress(address);
    const token = newToken();
    const quote = await createQuote({
      token_hash: await sha256(token),
      ip_hash: ipHash,
      address,
      matched_address: check.matchedAddress,
      area: check.area,
      service,
    });
    return reply({ id: quote.id, token, area: check.area, matchedAddress: check.matchedAddress, status: quote.status }, 201);
  } catch (error) {
    console.error("quote start failed", error instanceof Error ? error.message : "unknown error");
    return reply({ error: "That did not save. Please try again." }, 500);
  }
}

/** Where a quote stands. Reachable only with its token, and it never shows a suggestion. */
export async function GET(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  try {
    const quote = await loadQuote(id, quoteToken(request));
    if (!quote) return reply({ error: "No such quote." }, 404);
    return reply(publicQuote(quote));
  } catch (error) {
    console.error("quote read failed", error instanceof Error ? error.message : "unknown error");
    return reply({ error: "That did not load. Please try again." }, 500);
  }
}
