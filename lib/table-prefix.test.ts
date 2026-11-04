import assert from "node:assert/strict";
import { test } from "node:test";
import { prefixed } from "./table-prefix.ts";

test("tables and functions get the shared-project prefix", () => {
  assert.equal(prefixed("leads?id=eq.1&select=*"), "curbology_leads?id=eq.1&select=*");
  assert.equal(prefixed("rpc/lead_set_status"), "rpc/curbology_lead_set_status");
});
