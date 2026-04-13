/**
 * Example: Update file metadata for a specific file in a GakuNin RDM project.
 *
 * This example demonstrates the updateFileMetadata API by:
 *   1. Resolving the file path from a file ID via the v2 Files API.
 *   2. Fetching the project's file metadata and locating the matching entry.
 *   3. Overwriting 'grdm-file:data-description-ja' with a test value.
 *   4. Restoring the original value to leave the project in its original state.
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> \
 *   GRDM_NODE_ID=<node-id> \
 *   GRDM_FILE_ID=<file-id> \
 *   npx ts-node examples/update_grdm_file_metadata.ts
 *
 * Environment variables:
 *   GRDM_TOKEN    - GakuNin RDM personal access token (required)
 *   GRDM_NODE_ID  - Target project (node) ID, 5 characters (required)
 *   GRDM_FILE_ID  - Target file ID used by the OSF Files API (required)
 *   GRDM_BASE_URL - Override the v2 API base URL (default: https://api.rdm.nii.ac.jp/v2/)
 */

import { GrdmClient } from '../src/client';
import { GrdmFileItem } from '../src/types/file-metadata';

const TEST_DESCRIPTION = 'This is a test description by updateFileMetadata';

async function findFileByGrdmPath(
  client: GrdmClient,
  nodeId: string,
  grdmPath: string,
): Promise<GrdmFileItem | undefined> {
  const response = await client.fileMetadata.getByProject(nodeId);
  return response.data.attributes.files.find((f) => f.path === grdmPath);
}

async function printFileMetadata(fileItem: GrdmFileItem): Promise<void> {
  console.log(`  path      : ${fileItem.path}`);
  console.log(`  folder    : ${fileItem.folder}`);
  console.log(`  urlpath   : ${fileItem.urlpath}`);

  const active = fileItem.items?.find((item) => item.active);
  if (!active) {
    console.log('  (no active metadata schema)');
    return;
  }

  const data = active.data as Record<string, { value?: unknown }>;
  const descJa = data['grdm-file:data-description-ja']?.value;
  console.log(`  grdm-file:data-description-ja : ${descJa ?? '(not set)'}`);
}

async function main(): Promise<void> {
  const token = process.env.GRDM_TOKEN;
  const nodeId = process.env.GRDM_NODE_ID;
  const fileId = process.env.GRDM_FILE_ID;
  const baseUrl = process.env.GRDM_BASE_URL;

  if (!token) {
    console.error('Error: GRDM_TOKEN environment variable is required.');
    process.exit(1);
  }
  if (!nodeId) {
    console.error('Error: GRDM_NODE_ID environment variable is required.');
    process.exit(1);
  }
  if (!fileId) {
    console.error('Error: GRDM_FILE_ID environment variable is required.');
    process.exit(1);
  }

  const client = new GrdmClient({
    token,
    ...(baseUrl ? { baseUrl } : {}),
  });

  // ----------------------------------------------------------------
  // Step 1: Resolve the file path from GRDM_FILE_ID via the v2 Files API.
  //         OsfFileAttributes.provider + materialized_path gives the
  //         path format expected by the GRDM v1 file metadata API
  //         (e.g. "osfstorage/README.md").
  // ----------------------------------------------------------------
  console.log(`\n[Step 1] Fetching file info for ID: ${fileId}`);
  const osfFile = await client.files.getById(fileId);
  const grdmPath = `${osfFile.provider}${osfFile.materialized_path}`;
  console.log(`  Resolved GRDM path: ${grdmPath}`);

  // ----------------------------------------------------------------
  // Step 2 & 3: Fetch project file metadata and locate the target entry.
  // ----------------------------------------------------------------
  console.log(`\n[Step 2] Fetching file metadata for project: ${nodeId}`);
  const fileItem = await findFileByGrdmPath(client, nodeId, grdmPath);

  if (!fileItem) {
    console.log(`No file metadata found for path "${grdmPath}". Exiting.`);
    return;
  }
  console.log(`  Found file metadata entry for: ${grdmPath}`);

  // ----------------------------------------------------------------
  // Step 4: Preserve the original value of 'grdm-file:data-description-ja'.
  // ----------------------------------------------------------------
  const activeSchema = fileItem.items?.find((item) => item.active);
  const activeData = activeSchema?.data as
    | Record<string, { value?: unknown; extra: unknown[]; comments?: unknown[] }>
    | undefined;
  const originalDescription = activeData?.['grdm-file:data-description-ja']?.value ?? null;
  console.log(`\n[Step 4] Original 'grdm-file:data-description-ja': ${originalDescription ?? '(not set)'}`);

  // ----------------------------------------------------------------
  // Step 5: Update 'grdm-file:data-description-ja' to the test value.
  // ----------------------------------------------------------------
  console.log(`\n[Step 5] Updating 'grdm-file:data-description-ja' to: "${TEST_DESCRIPTION}"`);

  const updatedItems = fileItem.items?.map((schema) => {
    if (!schema.active) return schema;
    const data = schema.data as Record<string, { value?: unknown; extra: unknown[]; comments?: unknown[] }>;
    return {
      ...schema,
      data: {
        ...data,
        'grdm-file:data-description-ja': {
          value: TEST_DESCRIPTION,
          extra: data['grdm-file:data-description-ja']?.extra ?? [],
          comments: data['grdm-file:data-description-ja']?.comments ?? [],
        },
      },
    };
  });

  const updatedFileItem: GrdmFileItem = { ...fileItem, items: updatedItems ?? [] };
  await client.fileMetadata.updateFileMetadata(nodeId, updatedFileItem);
  console.log('  updateFileMetadata completed.');

  // ----------------------------------------------------------------
  // Step 6: Re-fetch and print the updated file metadata.
  // ----------------------------------------------------------------
  console.log(`\n[Step 6] File metadata after update:`);
  const afterUpdate = await findFileByGrdmPath(client, nodeId, grdmPath);
  if (afterUpdate) {
    await printFileMetadata(afterUpdate);
  }

  // ----------------------------------------------------------------
  // Step 7: Restore the original value.
  // ----------------------------------------------------------------
  console.log(
    `\n[Step 7] Restoring 'grdm-file:data-description-ja' to original value: ${originalDescription ?? '(not set)'}`,
  );

  const restoredItems = updatedFileItem.items?.map((schema) => {
    if (!schema.active) return schema;
    const data = schema.data as Record<string, { value?: unknown; extra: unknown[]; comments?: unknown[] }>;
    return {
      ...schema,
      data: {
        ...data,
        'grdm-file:data-description-ja': {
          value: originalDescription,
          extra: data['grdm-file:data-description-ja']?.extra ?? [],
          comments: data['grdm-file:data-description-ja']?.comments ?? [],
        },
      },
    };
  });

  const restoredFileItem: GrdmFileItem = { ...updatedFileItem, items: restoredItems ?? [] };
  await client.fileMetadata.updateFileMetadata(nodeId, restoredFileItem);
  console.log('  updateFileMetadata completed.');

  // ----------------------------------------------------------------
  // Step 8: Re-fetch and print the restored file metadata.
  // ----------------------------------------------------------------
  console.log(`\n[Step 8] File metadata after restore:`);
  const afterRestore = await findFileByGrdmPath(client, nodeId, grdmPath);
  if (afterRestore) {
    await printFileMetadata(afterRestore);
  }

  console.log('\nDone.');
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
