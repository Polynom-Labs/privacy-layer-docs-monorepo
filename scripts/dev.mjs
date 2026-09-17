#!/usr/bin/env node
// Runs the Mintlify local preview server against docs/docs.json. Like
// `mintlify export`, `mintlify dev` has no "target directory" option, so
// it must run with its cwd set to the docs submodule.
//
// docs.json is merged with the generated "Custom KYT providers" group only
// for the duration of the dev session - see scripts/lib/docs-json-merge.mjs
// - and restored (including on Ctrl+C) so the tracked file is left
// unchanged once the session ends. Uses async `spawn` (not `spawnSync`) so
// Ctrl+C can actually be handled while the dev server is running.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { withMergedDocsJson } from "./lib/docs-json-merge.mjs";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const docsDir = path.join(rootDir, "docs");

const status = await withMergedDocsJson(docsDir, (registerChild) => {
  const child = spawn("npx", ["mintlify", "dev", ...process.argv.slice(2)], {
    cwd: docsDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  registerChild(child);

  return new Promise((resolve) => {
    child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
});

process.exit(status);
