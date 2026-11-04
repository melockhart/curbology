import { adminOnly } from "../../../../lib/admin-action";
import { sniffPhoto } from "../../../../lib/quote/rules";
import { fetchPhoto } from "../../../../lib/quote/store";

/** Customer photos are private, so the console reads them through a signed-in route. */
export async function GET(request: Request) {
  const session = await adminOnly();
  if (session instanceof Response) return session;

  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(path)) return new Response("Not found", { status: 404 });
  const bytes = await fetchPhoto(path).catch(() => null);
  const type = bytes && sniffPhoto(bytes);
  if (!bytes || !type) return new Response("Not found", { status: 404 });
  return new Response(bytes as Uint8Array<ArrayBuffer>, {
    headers: { "Content-Type": type.mediaType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
