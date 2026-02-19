/**
 * Example: List all GakuNin RDM projects accessible by the authenticated user,
 * using pagination to retrieve all pages.
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> npx ts-node examples/list-all-projects.ts
 *
 * Environment variables:
 *   GRDM_TOKEN    - Your GakuNin RDM personal access token (required)
 *   GRDM_BASE_URL - Optional: Override the v2 API base URL
 *                   (default: https://api.rdm.nii.ac.jp/v2/)
 *   PAGE_SIZE     - Optional: Number of items per page (default: 10)
 *
 * This example demonstrates three pagination approaches:
 *   1. Page-by-page iteration  : for await (const page of result)
 *   2. Item-by-item iteration  : for await (const item of result.items())
 *   3. Collect all at once     : await result.toArray()
 */

import { GrdmClient } from '../src/client';

async function main(): Promise<void> {
  const token = process.env.GRDM_TOKEN;
  const baseUrl = process.env.GRDM_BASE_URL;
  const pageSize = parseInt(process.env.PAGE_SIZE ?? '10', 10);

  if (!token) {
    console.error('Error: GRDM_TOKEN environment variable is required.');
    console.log('  export GRDM_TOKEN="your-personal-access-token"');
    process.exit(1);
  }

  const client = new GrdmClient({
    token,
    ...(baseUrl ? { baseUrl } : {}),
  });

  // ----------------------------------------------------------------
  // Fetch the authenticated user's information first
  // ----------------------------------------------------------------
  console.log('Fetching authenticated user info...');
  const me = await client.users.me();
  console.log(`Logged in as: ${me.full_name} (id: ${me.id})\n`);

  // ----------------------------------------------------------------
  // Approach 1: Page-by-page iteration
  //
  // Use `for await (const page of result)` to process each page
  // one at a time. This is useful when you need to handle results
  // in batches or show progress as pages load.
  // ----------------------------------------------------------------
  console.log('=== Approach 1: Page-by-page iteration ===\n');

  const paginatedByPage = await client.nodes.listNodesPaginated({
    'filter[contributors]': me.id,
    'page[size]': pageSize,
  });

  const totalCount = paginatedByPage.meta?.['total'] as number | undefined;
  if (totalCount !== undefined) {
    console.log(`Total projects: ${totalCount}`);
  }

  let pageNumber = 0;
  let totalProjectsFromPages = 0;

  for await (const page of paginatedByPage) {
    pageNumber++;
    totalProjectsFromPages += page.length;
    console.log(`  Page ${pageNumber}: ${page.length} project(s)`);

    for (const node of page) {
      const visibility = node.public ? 'public' : 'private';
      console.log(`    - [${node.id}] ${node.title} (${node.category}, ${visibility})`);
    }
  }

  console.log(`\nTotal projects fetched (page-by-page): ${totalProjectsFromPages}\n`);

  // ----------------------------------------------------------------
  // Approach 2: Item-by-item iteration
  //
  // Use `result.items()` to iterate over individual items across all
  // pages without managing page boundaries manually. This is the
  // simplest approach for processing each project one at a time.
  // ----------------------------------------------------------------
  console.log('=== Approach 2: Item-by-item iteration ===\n');

  const paginatedByItem = await client.nodes.listNodesPaginated({
    'filter[contributors]': me.id,
    'page[size]': pageSize,
  });

  let itemIndex = 0;

  for await (const node of paginatedByItem.items()) {
    itemIndex++;
    const createdAt = new Date(node.date_created).toLocaleDateString('ja-JP');
    console.log(`  ${itemIndex}. [${node.id}] ${node.title}`);
    console.log(`       Category : ${node.category}`);
    console.log(`       Public   : ${node.public}`);
    console.log(`       Created  : ${createdAt}`);
  }

  console.log(`\nTotal projects fetched (item-by-item): ${itemIndex}\n`);

  // ----------------------------------------------------------------
  // Approach 3: Collect all items at once with toArray()
  //
  // Use `result.toArray()` to load all pages and return a flat array.
  // Simple and convenient, but loads all data into memory at once.
  // Avoid this for very large datasets; prefer Approach 1 or 2.
  // ----------------------------------------------------------------
  console.log('=== Approach 3: Collect all at once (toArray) ===\n');

  const paginatedAll = await client.nodes.listNodesPaginated({
    'filter[contributors]': me.id,
    'page[size]': pageSize,
  });

  const allProjects = await paginatedAll.toArray();

  console.log(`Total projects collected: ${allProjects.length}`);
  allProjects.forEach((node, index) => {
    console.log(`  ${index + 1}. [${node.id}] ${node.title} (${node.category})`);
  });
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
