import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import AdmZip from "adm-zip";

const [, , zipPath, outputDir] = process.argv;

if (!zipPath || !outputDir) {
  console.error("Usage: node scripts/unpack-mintlify-export.mjs <zipPath> <outputDir>");
  process.exit(1);
}

const resolvedZipPath = path.resolve(zipPath);
const resolvedOutputDir = path.resolve(outputDir);

if (!fs.existsSync(resolvedZipPath)) {
  console.error(`Export archive not found: ${resolvedZipPath}`);
  process.exit(1);
}

fs.rmSync(resolvedOutputDir, { recursive: true, force: true });
fs.mkdirSync(resolvedOutputDir, { recursive: true });

const zip = new AdmZip(resolvedZipPath);
zip.extractAllTo(resolvedOutputDir, true);

for (const relativePath of [
  ".gitignore",
  ".mintignore",
  "serve.js",
  "Start Docs.command",
  "Start Docs.bat",
  "scripts"
]) {
  fs.rmSync(path.join(resolvedOutputDir, relativePath), {
    recursive: true,
    force: true
  });
}

console.log(`Extracted ${resolvedZipPath} -> ${resolvedOutputDir}`);
