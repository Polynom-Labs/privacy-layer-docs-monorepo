#!/usr/bin/env node
// Merges the `sdk` submodule's standalone docs (sdk/docs/**) into the
// "Privacy Layer" > "SDK" pages inside the `docs` submodule. The sdk
// submodule owns its own docs.json for its standalone site; that file is
// intentionally skipped here because docs/docs.json remains the single
// source of truth for navigation in this monorepo's build.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const sourceDir = path.join(rootDir, "sdk", "docs");
const destDir = path.join(rootDir, "docs", "products", "privacy-layer", "sdk");

if (!fs.existsSync(sourceDir)) {
  console.error(`SDK docs source not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

fs.cpSync(sourceDir, destDir, {
  recursive: true,
  force: true,
  filter: (source) => path.basename(source) !== "docs.json"
});

// sdk/docs is written as the root of its own standalone Mintlify site
// (see sdk/docs/docs.json), so its internal links are root-relative to
// that site, e.g. "/overview/packages". Embedded here, the same pages
// live under /products/privacy-layer/sdk/**, so rewrite links to those
// top-level sdk sections to include that prefix.
const EMBED_PREFIX = "/products/privacy-layer/sdk";
const SDK_TOP_LEVEL_SECTIONS = [
  "overview",
  "concepts",
  "integration",
  "application-development",
  "snippets"
];
const linkPattern = new RegExp(
  `((?:\\]\\(|href=")\\/)(${SDK_TOP_LEVEL_SECTIONS.join("|")})(?=[/)"#])`,
  "g"
);

function rewriteInternalLinks(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteInternalLinks(entryPath);
      continue;
    }
    if (!/\.(mdx|jsx|tsx|md)$/.test(entry.name)) continue;

    const original = fs.readFileSync(entryPath, "utf8");
    const rewritten = original.replace(linkPattern, `$1${EMBED_PREFIX.slice(1)}/$2`);
    if (rewritten !== original) {
      fs.writeFileSync(entryPath, rewritten);
    }
  }
}

rewriteInternalLinks(destDir);

console.log(`Synced ${sourceDir} -> ${destDir}`);
