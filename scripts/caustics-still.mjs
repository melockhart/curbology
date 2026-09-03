/**
 * Renders one frame of the live caustics shader to a still, for every machine
 * that cannot run WebGL.
 *
 * The fallback is a frame of the SAME shader rather than a different texture,
 * so a visitor without WebGL sees the design and loses only the movement. A
 * hand-made substitute would be a second thing to keep in step with the first.
 *
 *   node scripts/caustics-still.mjs http://127.0.0.1:3000 public/brand/caustics-deep.jpg
 */
import { chromium } from "playwright";

const [base = "http://127.0.0.1:3000", out = "public/brand/caustics-deep.jpg"] = process.argv.slice(2);

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
// The flag has to be set before the component's effect runs, or the context is
// already created without preserveDrawingBuffer and the capture comes back blank.
await page.addInitScript(() => { window.__CAUSTICS_CAPTURE__ = true; });
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(3200);

const dataUrl = await page.evaluate(() => {
  const c = document.querySelector("section canvas");
  return c ? c.toDataURL("image/jpeg", 0.84) : null;
});
if (!dataUrl) { console.error("No caustics canvas found."); process.exit(1); }

const { writeFile } = await import("node:fs/promises");
await writeFile(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(`caustics still → ${out}`);
await browser.close();
