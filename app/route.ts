import { renderPage } from "../lib/v2/render";

export function GET(request: Request) {
  return renderPage("/", request);
}
