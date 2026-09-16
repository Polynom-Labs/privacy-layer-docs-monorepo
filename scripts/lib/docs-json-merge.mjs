// Lets build/dev scripts merge generated navigation (currently just the
// "Custom KYT providers" group) into docs/docs.json for the duration of a
// Mintlify command, then restore the pre-merge working-tree content afterward.
// Prefer the on-disk working copy so uncommitted nav edits (new SDK pages,
// etc.) are visible in `mintlify dev`. Strip any leftover generated group
// first in case a previous run did not restore cleanly.
import fs from "node:fs";
import path from "node:path";

import { CUSTOM_KYT_GROUP_NAME, buildCustomKytNavGroup } from "./custom-kyt-nav.mjs";

function findGroupIndex(navPages, groupName) {
  return navPages.findIndex(
    (entry) => typeof entry === "object" && entry !== null && entry.group === groupName
  );
}

function stripGeneratedGroups(docsJson) {
  const navPages = docsJson.navigation?.pages;
  if (!Array.isArray(navPages)) return;
  const index = findGroupIndex(navPages, CUSTOM_KYT_GROUP_NAME);
  if (index !== -1) navPages.splice(index, 1);
}

function readBaseDocsJson(docsDir) {
  const docsJsonPath = path.join(docsDir, "docs.json");
  const json = JSON.parse(fs.readFileSync(docsJsonPath, "utf8"));
  stripGeneratedGroups(json);
  const text = `${JSON.stringify(json, null, 2)}\n`;
  return { text, json };
}

function mergeGeneratedNavigation(baseJson) {
  const merged = JSON.parse(JSON.stringify(baseJson));
  const navPages = merged.navigation?.pages;
  if (!Array.isArray(navPages)) {
    throw new Error("Unexpected docs.json shape: navigation.pages is not an array");
  }

  const group = buildCustomKytNavGroup();
  const existingIndex = findGroupIndex(navPages, CUSTOM_KYT_GROUP_NAME);
  const supportIndex = findGroupIndex(navPages, "Support");

  if (existingIndex !== -1) {
    navPages[existingIndex] = group;
  } else if (supportIndex !== -1) {
    navPages.splice(supportIndex, 0, group);
  } else {
    navPages.push(group);
  }

  return merged;
}

// Writes the merged docs.json to disk, runs `run(registerChild)`, and
// restores the pre-merge working-tree content afterward - including on
// Ctrl+C - so a `mintlify dev` session never leaves a stray generated
// Custom KYT group behind, and never discards uncommitted nav edits.
//
// `run` receives a `registerChild(childProcess)` callback. Pass it any
// long-running child process (e.g. `mintlify dev` spawned asynchronously)
// so a SIGINT/SIGTERM sent to this script also kills that child before
// restoring docs.json. This must use async `spawn`, not `spawnSync`: a
// synchronous spawn blocks Node's event loop for its whole lifetime, so a
// `process.on("SIGINT", ...)` handler never gets a chance to run until the
// child exits on its own.
export async function withMergedDocsJson(docsDir, run) {
  const docsJsonPath = path.join(docsDir, "docs.json");
  const base = readBaseDocsJson(docsDir);
  const merged = mergeGeneratedNavigation(base.json);

  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    fs.writeFileSync(docsJsonPath, base.text);
  };

  let activeChild = null;
  const registerChild = (child) => {
    activeChild = child;
  };

  const onSignal = () => {
    if (activeChild) activeChild.kill("SIGINT");
    restore();
    process.exit(1);
  };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    fs.writeFileSync(docsJsonPath, `${JSON.stringify(merged, null, 2)}\n`);
    return await run(registerChild);
  } finally {
    restore();
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}
