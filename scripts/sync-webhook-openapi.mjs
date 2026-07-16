#!/usr/bin/env node
// Extracts the OpenAPI spec from the `webhook` submodule (the reference KYT
// check-provider implementation) into the `docs` submodule and generates
// the "Custom KYT providers" > "API reference" pages from it. All output
// paths here are covered by docs/.gitignore: they're regenerated on every
// sync, not committed. docs.json itself is left untouched - the
// corresponding navigation group is merged in transiently by
// scripts/lib/docs-json-merge.mjs only while a Mintlify command runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CUSTOM_KYT_OPENAPI_RELATIVE, CUSTOM_KYT_PAGES_DIR_RELATIVE } from "./lib/custom-kyt-nav.mjs";

const rootDir = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const webhookOpenapiSource = path.join(rootDir, "webhook", "openapi.yaml");
const docsDir = path.join(rootDir, "docs");
const openapiDest = path.join(docsDir, CUSTOM_KYT_OPENAPI_RELATIVE);
const pagesDir = path.join(docsDir, CUSTOM_KYT_PAGES_DIR_RELATIVE);

if (!fs.existsSync(webhookOpenapiSource)) {
  console.error(`Webhook OpenAPI spec not found: ${webhookOpenapiSource}`);
  process.exit(1);
}

// 1. Copy the OpenAPI spec verbatim.
fs.mkdirSync(path.dirname(openapiDest), { recursive: true });
fs.copyFileSync(webhookOpenapiSource, openapiDest);
console.log(`Copied ${webhookOpenapiSource} -> ${openapiDest}`);

// 2. Generate the API reference pages that point at the copied spec.
fs.mkdirSync(pagesDir, { recursive: true });

const overviewPage = `---
title: "Custom KYT provider API"
sidebarTitle: "Overview"
description: "Reference webhook contract for a Custom KYT check provider."
---

A Custom KYT provider implements two HTTP endpoints that the Arcane audit
backend calls: a metadata endpoint requested once at initialization (and
again whenever the provider's version changes), and an address-check
endpoint called per KYT screening.

## Methods

| Method | Path | Purpose |
| --- | --- | --- |
| \`GET\` | \`/metadata\` | [Provider metadata](/products/custom-kyt-providers/api-reference/metadata). |
| \`POST\` | \`/check\` | [Check address](/products/custom-kyt-providers/api-reference/check). |
`;

const metadataPage = `---
title: "Provider metadata"
description: "Provider identity/version metadata."
openapi: "/${CUSTOM_KYT_OPENAPI_RELATIVE} GET /metadata"
---
`;

const checkPage = `---
title: "Check address"
description: "Check whether an address is approved."
openapi: "/${CUSTOM_KYT_OPENAPI_RELATIVE} POST /check"
---
`;

fs.writeFileSync(path.join(pagesDir, "overview.mdx"), overviewPage);
fs.writeFileSync(path.join(pagesDir, "metadata.mdx"), metadataPage);
fs.writeFileSync(path.join(pagesDir, "check.mdx"), checkPage);
console.log(`Generated API reference pages in ${pagesDir}`);
