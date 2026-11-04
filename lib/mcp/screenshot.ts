import { browserBinding } from "../env";
import { DRAFT_COOKIE } from "../cms/signing";

export const DEVICES = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1100 },
  phone: { width: 390, height: 844 },
} as const;
export type Device = keyof typeof DEVICES;

/** Long pages would make an image too large for a client to accept. */
const MAX_FULL_PAGE_HEIGHT = 6000;

/**
 * Headless Chrome through Cloudflare's browser binding. Base64 JPEG out.
 * The package is imported here and not at the top of the file because it only
 * loads inside a Worker, and the rest of the MCP server has to run anywhere.
 */
export async function takeScreenshot(options: {
  origin: string;
  path: string;
  device: Device;
  fullPage: boolean;
  draftCookie?: string;
}): Promise<string> {
  const binding = browserBinding();
  if (!binding) throw new Error("Screenshots run on the deployed site, through Cloudflare's browser binding, which is not available here.");

  const { default: puppeteer } = await import("@cloudflare/puppeteer");
  const browser = await puppeteer.launch(binding as Parameters<typeof puppeteer.launch>[0]);
  try {
    const page = await browser.newPage();
    await page.setViewport(DEVICES[options.device]);
    if (options.draftCookie) {
      const { hostname } = new URL(options.origin);
      await page.setCookie({ name: DRAFT_COOKIE, value: options.draftCookie, domain: hostname, path: "/", httpOnly: true, secure: true });
    }
    await page.goto(`${options.origin}${options.path}`, { waitUntil: "networkidle0", timeout: 30_000 });
    // Lets the page's entrance motion settle, so the picture is not caught mid-animation.
    await new Promise((done) => setTimeout(done, 1500));

    let clip: { x: number; y: number; width: number; height: number } | undefined;
    if (options.fullPage) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      clip = { x: 0, y: 0, width: DEVICES[options.device].width, height: Math.min(height, MAX_FULL_PAGE_HEIGHT) };
    }
    const image = await page.screenshot({ type: "jpeg", quality: 72, encoding: "base64", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
    return image as string;
  } finally {
    await browser.close();
  }
}
