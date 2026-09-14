#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const sdkDocs = path.join(rootDir, "sdk", "docs");

if (fs.existsSync(sdkDocs)) {
  process.exit(0);
}

console.error("sdk/docs is missing; trying git submodule update --init --recursive");
try {
  execSync("git submodule update --init --recursive", {
    cwd: rootDir,
    stdio: "inherit"
  });
} catch {
  // Fall through to the same missing-path check.
}

if (fs.existsSync(sdkDocs)) {
  process.exit(0);
}

console.error(`SDK docs source not found: ${sdkDocs}

The docs build copies sdk/docs from the privacy-layer-confidential-sdk
submodule. DigitalOcean must clone submodules. Grant the GitHub App access to:

  Polynom-Labs/privacy-layer-confidential-sdk
  Polynom-Labs/docs
  Polynom-Labs/reference-csv-blacklist-service

Then redeploy. Locally this is: git submodule update --init --recursive`);
process.exit(1);
