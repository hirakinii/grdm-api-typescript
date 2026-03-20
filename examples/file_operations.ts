/**
 * Example: File operations using GrdmClient.
 *
 * Demonstrates listing root files, navigating subfolders, downloading,
 * uploading, and deleting files on GakuNin RDM.
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> npx ts-node examples/file_operations.ts [nodeId]
 *
 * Environment variables:
 *   GRDM_TOKEN    - Your GakuNin RDM personal access token (required)
 *   GRDM_BASE_URL - Override the v2 API base URL (default: https://api.rdm.nii.ac.jp/v2/)
 */

import { GrdmClient } from '../src/client';

async function main(): Promise<void> {
  const token = process.env.GRDM_TOKEN;
  const baseUrl = process.env.GRDM_BASE_URL;
  const nodeId = process.argv[2];

  if (!token) {
    console.error('Error: GRDM_TOKEN environment variable is required.');
    process.exit(1);
  }

  const client = new GrdmClient({
    token,
    ...(baseUrl ? { baseUrl } : {}),
  });

  try {
    let targetNodeId = nodeId;

    if (!targetNodeId) {
      console.log('No nodeId provided. Fetching your first project...');
      const currentUser = await client.users.me();
      const myNodes = await client.nodes.listNodes({
        'filter[contributors]': currentUser.id,
        'page[size]': 1,
      });
      if (myNodes.data.length === 0) {
        console.error('No projects found in your account.');
        return;
      }
      targetNodeId = myNodes.data[0].id;
      console.log(`Using project: ${myNodes.data[0].title} (${targetNodeId})`);
    }

    // ----------------------------------------------------------------
    // 1. List storage providers
    // ----------------------------------------------------------------
    console.log(`\n=== Storage Providers (node: ${targetNodeId}) ===\n`);
    const providers = await client.files.listProviders(targetNodeId);
    console.log('Providers available:', providers.data.map((p) => p.name).join(', '));

    const provider = providers.data[0]?.provider ?? 'osfstorage';

    // ----------------------------------------------------------------
    // 2. List root-level files
    // ----------------------------------------------------------------
    console.log(`\n=== Root Files (provider: ${provider}) ===\n`);
    const rootFiles = await client.files.listByNode(targetNodeId, provider);

    if (rootFiles.data.length === 0) {
      console.log('No files found at the root of this storage provider.');
      return;
    }

    for (const item of rootFiles.data) {
      const tag = item.kind === 'folder' ? '[DIR] ' : '[FILE]';
      const size = item.kind === 'file' ? ` (${item.size ?? 0} bytes)` : '';
      console.log(`${tag} ${item.name}${size}  path: ${item.path}`);
    }

    // ----------------------------------------------------------------
    // 3. Navigate into the first subfolder using grdmFiles.listByPath
    // ----------------------------------------------------------------
    const firstFolder = rootFiles.data.find((f) => f.kind === 'folder');
    if (firstFolder?.path) {
      console.log(`\n=== Subfolder Contents: ${firstFolder.name} ===\n`);
      console.log(`(using grdmFiles.listByPath — path: ${firstFolder.path})\n`);

      const subFiles = await client.grdmFiles.listByPath(targetNodeId, provider, firstFolder.path);

      if (subFiles.data.length === 0) {
        console.log('  (empty folder)');
      } else {
        for (const item of subFiles.data) {
          const tag = item.kind === 'folder' ? '[DIR] ' : '[FILE]';
          console.log(`  ${tag} ${item.name}`);
        }
      }
    }

    // ----------------------------------------------------------------
    // 4. Paginate through a subfolder using grdmFiles.listByPathPaginated
    // ----------------------------------------------------------------
    if (firstFolder?.path) {
      console.log(`\n=== Paginated Subfolder Listing: ${firstFolder.name} ===\n`);
      console.log('(using grdmFiles.listByPathPaginated)\n');

      const paged = await client.grdmFiles.listByPathPaginated(targetNodeId, provider, firstFolder.path);

      let count = 0;
      for await (const item of paged.items()) {
        const tag = item.kind === 'folder' ? '[DIR] ' : '[FILE]';
        console.log(`  ${tag} ${item.name}`);
        count++;
      }
      console.log(`\nTotal items (all pages): ${count}`);
    }

    // ----------------------------------------------------------------
    // 5. Download the first file found at root
    // ----------------------------------------------------------------
    const firstFile = rootFiles.data.find((f) => f.kind === 'file');
    if (firstFile) {
      console.log(`\n=== Download: ${firstFile.name} ===\n`);
      const content = await client.files.download(firstFile);
      console.log(`Downloaded ${content.byteLength} bytes.`);
    }

    // ----------------------------------------------------------------
    // 6. Upload a new test file, update it, then delete it
    // ----------------------------------------------------------------
    const rootProvider = providers.data.find((p) => p.provider === 'osfstorage');
    if (rootProvider) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `grdm-sdk-test-${timestamp}.txt`;

      console.log(`\n=== Upload: ${fileName} ===\n`);
      const initialContent = new TextEncoder().encode('Test file created by grdm-api-typescript example.');
      const uploaded = await client.files.uploadNew(rootProvider, fileName, initialContent);
      console.log(`Uploaded: ${uploaded.name} (ID: ${uploaded.id})`);

      console.log(`\n=== Update: ${uploaded.name} ===\n`);
      const updatedContent = new TextEncoder().encode('Content updated by grdm-api-typescript.');
      const updated = await client.files.upload(uploaded, updatedContent);
      console.log(`Updated. New size: ${updated.size} bytes`);

      console.log(`\n=== Delete: ${updated.name} ===\n`);
      await client.files.deleteFile(updated);
      console.log('Test file deleted.');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
