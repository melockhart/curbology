import assert from "node:assert/strict";
import { test } from "node:test";

// Kept beside core.ts rather than importing it: core.ts pulls JSON and page data
// that the plain node test runner cannot resolve. The expression must stay identical.
const isSafeImageUrl = (url: string) => /^(https:\/\/|\/(?!\/))[A-Za-z0-9._~:/?#@!$&+,;=%-]+$/.test(url);

test("image URLs that could end an attribute or url() are refused", () => {
  assert.ok(isSafeImageUrl("https://x.supabase.co/storage/v1/object/public/a/b.jpg"));
  assert.ok(isSafeImageUrl("/v2/p-hero.jpg"));
  for (const bad of ['https://x/a.jpg"><script>', "https://x/a.jpg)}body{", "javascript:alert(1)", "http://x/a.jpg", "//evil.example/a.jpg", "/a b.jpg", "https://x/a'b.jpg", "data:image/png;base64,AAAA"]) {
    assert.equal(isSafeImageUrl(bad), false, bad);
  }
});
