/**
 * Example: Fetch file metadata via a reverse proxy to avoid CORS errors.
 *
 * Background:
 *   The GRDM v1 API (rdm.nii.ac.jp/api/v1) does not return CORS headers, so
 *   direct browser requests are blocked. A common workaround is to route v1 API
 *   calls through a local reverse proxy (e.g. Next.js rewrites, Vite proxy,
 *   nginx) and rewrite the URL before the request is sent.
 *
 *   GrdmClient accepts a custom `fetch` function for exactly this purpose.
 *   The library adds the Authorization header before calling your function,
 *   so you only need to rewrite the URL — no auth logic required.
 *
 * Proxy setup (example — Next.js next.config.js):
 *   rewrites: async () => [{
 *     source: '/grdm-v1-api/:path*',
 *     destination: 'https://rdm.nii.ac.jp/api/v1/:path*',
 *   }]
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/file_metadata_via_proxy.ts
 *
 * Environment variables:
 *   GRDM_TOKEN        - Your GakuNin RDM personal access token (required)
 *   GRDM_NODE_ID      - The project (node) ID to fetch file metadata for (required)
 *   GRDM_BASE_URL     - Optional: Override the v2 API base URL (default: https://api.rdm.nii.ac.jp/v2/)
 *   GRDM_V1_BASE_URL  - Optional: Override the v1 API base URL or proxy path
 *                       (default: /grdm-v1-api in proxy mode, or inferred from GRDM_BASE_URL)
 *   GRDM_PROXY_PREFIX - Optional: URL prefix to substitute for the original v1 base URL
 *                       (default: /grdm-v1-api)
 */

import { GrdmClient } from '../src/client';
import { GrdmFileMetadataFields, SCHEMA_ID_PUBLIC_FUNDING } from '../src/types/file-metadata';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const token = process.env.GRDM_TOKEN;
const nodeId = process.env.GRDM_NODE_ID;
const baseUrl = process.env.GRDM_BASE_URL;
const v1BaseUrl = process.env.GRDM_V1_BASE_URL ?? 'https://rdm.nii.ac.jp/api/v1';
const proxyPrefix = process.env.GRDM_PROXY_PREFIX ?? '/grdm-v1-api';

if (!token) {
  console.error('Error: GRDM_TOKEN environment variable is required.');
  process.exit(1);
}

if (!nodeId) {
  console.error('Error: GRDM_NODE_ID environment variable is required.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Custom fetch — rewrites the v1 API URL to the local proxy path.
//
// The library has already attached the Authorization header at this point,
// so this function only needs to perform the URL substitution.
// ---------------------------------------------------------------------------
const grdmProxyFetch: typeof fetch = (input, init) => {
  const originalUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const proxiedUrl = originalUrl.replace(v1BaseUrl, proxyPrefix);

  if (originalUrl !== proxiedUrl) {
    console.log(`[proxy] ${originalUrl}`);
    console.log(`     -> ${proxiedUrl}`);
  }

  return fetch(proxiedUrl, init);
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // When using a proxy, pass the proxy path as v1BaseUrl so that the
  // constructed endpoint URL is already in proxy form — no rewriting needed.
  // When the original absolute URL is kept as v1BaseUrl, grdmProxyFetch
  // performs the substitution at request time.
  const client = new GrdmClient({
    token,
    ...(baseUrl ? { baseUrl } : {}),
    v1BaseUrl,
    fetch: grdmProxyFetch,
  });

  console.log(`\n=== File Metadata via Proxy (project: ${nodeId}) ===`);
  console.log(`v1 base URL : ${v1BaseUrl}`);
  console.log(`proxy prefix: ${proxyPrefix}\n`);

  const response = await client.fileMetadata.getByProject(nodeId as string);
  const files = response.data.attributes.files;

  if (files.length === 0) {
    console.log('No file metadata found for this project.');
    return;
  }

  console.log(`Found ${files.length} file(s) with metadata:\n`);

  for (const file of files) {
    console.log(`Path   : ${file.path}`);
    console.log(`Folder : ${file.folder}`);

    const active = file.items?.find((item) => item.active);
    if (active) {
      console.log(`Schema : ${active.schema}`);
      if (active?.schema !== SCHEMA_ID_PUBLIC_FUNDING) continue;
      const metadataData = active.data as GrdmFileMetadataFields;
      const titleJa = metadataData['grdm-file:title-ja']?.value;
      const titleEn = metadataData['grdm-file:title-en']?.value;
      const fileType = metadataData['grdm-file:file-type']?.value;
      if (titleJa) console.log(`Title (JA): ${titleJa}`);
      if (titleEn) console.log(`Title (EN): ${titleEn}`);
      if (fileType) console.log(`File Type : ${fileType}`);
    } else {
      console.log('(No active metadata schema)');
    }

    console.log('');
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
