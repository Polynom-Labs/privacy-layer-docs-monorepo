import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { withMergedDocsJson } from "./docs-json-merge.mjs";

async function fixture(navigation, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "arcane-nav-test-"));
  const file = path.join(dir, "docs.json");
  const original = JSON.stringify({ navigation }, null, 4) + "\n";
  fs.writeFileSync(file, original);
  try {
    await run(dir, () => JSON.parse(fs.readFileSync(file, "utf8")));
    assert.equal(fs.readFileSync(file, "utf8"), original);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("legacy navigation retains a single generated group before Support", async () => {
  await fixture({ pages: [{ group: "Custom KYT providers", pages: [] }, { group: "Support", pages: [] }] }, async (dir, read) => {
    await withMergedDocsJson(dir, async () => {
      assert.deepEqual(read().navigation.pages.map(x => x.group), ["Custom KYT providers", "Support"]);
    });
  });
});

test("tabs place generated KYT only in Developer resources and preserve Products", async () => {
  const products = { tab: "Products", groups: [{ group: "Privacy Layer", pages: ["about"] }] };
  await fixture({ tabs: [products, { tab: "Developer resources", groups: [{ group: "Privacy Layer", pages: ["sdk"] }, { group: "Support", pages: [] }] }] }, async (dir, read) => {
    await withMergedDocsJson(dir, async () => {
      const tabs = read().navigation.tabs;
      assert.deepEqual(tabs[0], products);
      assert.deepEqual(tabs[1].groups.map(x => x.group), ["Privacy Layer", "Custom KYT providers", "Support"]);
    });
    await withMergedDocsJson(dir, async () => {
      assert.equal(read().navigation.tabs[1].groups.filter(x => x.group === "Custom KYT providers").length, 1);
    });
  });
});

test("failed command restores the exact source configuration", async () => {
  await fixture({ pages: ["start-here"] }, async (dir) => {
    await assert.rejects(withMergedDocsJson(dir, async () => { throw new Error("test failure"); }), /test failure/);
  });
});
