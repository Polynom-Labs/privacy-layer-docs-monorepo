#!/usr/bin/env node
// Exports the Mintlify site defined by docs/docs.json and unpacks it into
// dist/ at the monorepo root. `mintlify export` has no "target directory"
// option, so it must run with its cwd set to the docs submodule (where
// docs.json lives); the output zip and unpacked site live outside that
// submodule, in the monorepo's own build directories.
//
// docs.json is merged with the generated "Custom KYT providers" group only
// for the duration of the export - see scripts/lib/docs-json-merge.mjs -
// so the docs submodule's tracked docs.json is left unchanged afterward.
// Uses async `spawn` (not `spawnSync`) so Ctrl+C mid-export still restores
// docs.json instead of leaving the child export process to finish first.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { withMergedDocsJson } from "./lib/docs-json-merge.mjs";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const docsDir = path.join(rootDir, "docs");
const appBuildDir = path.join(rootDir, ".app-build");
const distDir = path.join(rootDir, "dist");
const exportZipPath = path.join(appBuildDir, "export.zip");

fs.rmSync(appBuildDir, { recursive: true, force: true });
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(appBuildDir, { recursive: true });

const exportStatus = await withMergedDocsJson(docsDir, (registerChild) => {
  const child = spawn("npx", ["mintlify", "export", "--output", exportZipPath], {
    cwd: docsDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  registerChild(child);

  return new Promise((resolve) => {
    child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
});

if (exportStatus !== 0) {
  process.exit(exportStatus);
}

const unpackStatus = await new Promise((resolve) => {
  const child = spawn(
    process.execPath,
    [path.join(rootDir, "scripts", "unpack-mintlify-export.mjs"), exportZipPath, distDir],
    { cwd: rootDir, stdio: "inherit" }
  );
  child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
});

process.exit(unpackStatus);
