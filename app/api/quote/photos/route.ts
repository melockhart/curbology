import { notReady, quoteToken, reply } from "../../../../lib/quote/http";
import { MAX_PHOTO_BYTES, sniffPhoto } from "../../../../lib/quote/rules";
import { loadQuote, storePhoto } from "../../../../lib/quote/store";

/** One photo per request, sent as the raw body, so a slow connection loses one photo and not all. */
export async function POST(request: Request) {
  const blocked = notReady();
  if (blocked) return blocked;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_PHOTO_BYTES) return reply({ error: "That photo is too large." }, 413);

  try {
    const quote = await loadQuote(id, quoteToken(request));
    if (!quote) return reply({ error: "No such quote." }, 404);
    if (quote.status !== "draft") return reply({ error: "This quote has already been sent." }, 409);

    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > MAX_PHOTO_BYTES) return reply({ error: "That photo is too large." }, 413);
    const type = sniffPhoto(bytes);
    if (!type) return reply({ error: "Please send a JPEG, PNG or WebP photo." }, 415);

    if (!(await storePhoto(quote.id, bytes, type))) return reply({ error: "That is all the photos we can take." }, 409);
    return reply({ ok: true }, 201);
  } catch (error) {
    console.error("quote photo failed", error instanceof Error ? error.message : "unknown error");
    return reply({ error: "That photo did not save. Please try again." }, 500);
  }
}
