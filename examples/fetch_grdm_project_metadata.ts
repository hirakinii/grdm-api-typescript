/**
 * Example: Fetch project metadata for a GakuNin RDM project.
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch-project-metadata.ts
 *
 * Environment variables:
 *   GRDM_TOKEN   - Your GakuNin RDM personal access token (required)
 *   GRDM_NODE_ID - The project (node) ID to fetch metadata for (required)
 *   GRDM_BASE_URL - Optional: Override the v2 API base URL (default: https://api.rdm.nii.ac.jp/v2/)
 */

import { GrdmClient } from '../src/client';

async function main(): Promise<void> {
  const token = process.env.GRDM_TOKEN;
  const nodeId = process.env.GRDM_NODE_ID;
  const baseUrl = process.env.GRDM_BASE_URL;

  if (!token) {
    console.error('Error: GRDM_TOKEN environment variable is required.');
    process.exit(1);
  }

  if (!nodeId) {
    console.error('Error: GRDM_NODE_ID environment variable is required.');
    process.exit(1);
  }

  const client = new GrdmClient({
    token,
    ...(baseUrl ? { baseUrl } : {}),
  });

  // ----------------------------------------------------------------
  // 1. Fetch project metadata (registrations) for the given node
  // ----------------------------------------------------------------
  console.log(`\n=== Project Metadata (node: ${nodeId}) ===\n`);

  const projectMetadataList = await client.projectMetadata.listByNode(nodeId);

  if (projectMetadataList.data.length === 0) {
    console.log('No registrations found for this node.');
  } else {
    for (const registration of projectMetadataList.data) {
      console.log(`Registration ID : ${registration.id}`);
      console.log(`Title           : ${registration.title}`);
      console.log(`Date Created    : ${registration.date_created}`);

      const meta = registration.grdmMeta;
      if (meta) {
        if (meta.funder) console.log(`Funder          : ${meta.funder}`);
        if (meta.projectNameJa) console.log(`Project Name (JA): ${meta.projectNameJa}`);
        if (meta.projectNameEn) console.log(`Project Name (EN): ${meta.projectNameEn}`);
        if (meta.programNameJa) console.log(`Program Name (JA): ${meta.programNameJa}`);
        if (meta.programNameEn) console.log(`Program Name (EN): ${meta.programNameEn}`);
        if (meta.japanGrantNumber) console.log(`Grant Number    : ${meta.japanGrantNumber}`);
        if (meta.projectResearchField) console.log(`Research Field  : ${meta.projectResearchField}`);
        if (meta.grdmFiles && meta.grdmFiles.length > 0) {
          console.log(`Registered Files: ${meta.grdmFiles.length} file(s)`);
          for (const file of meta.grdmFiles) {
            console.log(`  - ${file.path}`);
          }
        }
      }

      console.log('');
    }

    if (projectMetadataList.links?.next) {
      console.log('(More registrations available — pagination not shown in this example.)');
    }
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
