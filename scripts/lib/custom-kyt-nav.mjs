// Shared definition of the "Custom KYT providers" navigation group so the
// content generator (sync-webhook-openapi.mjs) and the docs.json merge
// helper (docs-json-merge.mjs) stay in sync about paths and structure.
export const CUSTOM_KYT_GROUP_NAME = "Custom KYT providers";
export const CUSTOM_KYT_PAGES_DIR_RELATIVE = "products/custom-kyt-providers/api-reference";
export const CUSTOM_KYT_OPENAPI_RELATIVE = "openapi/custom-kyt-provider.yaml";

export function buildCustomKytNavGroup() {
  return {
    group: CUSTOM_KYT_GROUP_NAME,
    pages: [
      {
        group: "API reference",
        root: `${CUSTOM_KYT_PAGES_DIR_RELATIVE}/overview`,
        pages: [
          `${CUSTOM_KYT_PAGES_DIR_RELATIVE}/metadata`,
          `${CUSTOM_KYT_PAGES_DIR_RELATIVE}/check`
        ]
      }
    ]
  };
}
