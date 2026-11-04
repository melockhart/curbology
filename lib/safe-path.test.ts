import assert from "node:assert/strict";
import { test } from "node:test";
import { safePath } from "./safe-path.ts";

test("keeps a same-site path with its query", () => {
  assert.equal(safePath("/oauth/authorize?client_id=a&state=b"), "/oauth/authorize?client_id=a&state=b");
});

test("refuses anything that could leave the site", () => {
  for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "\\\\evil.example", "/x\nLocation: y", "javascript:alert(1)", "", null, undefined, 5]) {
    assert.equal(safePath(bad), "/admin", String(bad));
  }
});
