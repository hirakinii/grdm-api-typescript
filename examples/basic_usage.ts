import { GrdmClient } from '../src/client';

/**
 * Basic usage example of the GakuNin RDM API client.
 *
 * To run this example:
 * 1. Set your GakuNin RDM Personal Access Token as an environment variable:
 *    export GRDM_TOKEN='your-personal-access-token'
 * 2. Run with ts-node:
 *    npx ts-node examples/basic_usage.ts
 */
async function main() {
  const token = process.env.GRDM_TOKEN;

  if (!token) {
    console.error('Error: GRDM_TOKEN environment variable is not set.');
    console.log('Please set it using: export GRDM_TOKEN="your-token"');
    process.exit(1);
  }

  // 1. Initialize the client
  const client = new GrdmClient({
    token: token,
    // baseUrl: 'https://api.rdm.nii.ac.jp/v2/', // Optional, defaults to production
  });

  try {
    // 2. Get the currently authenticated user
    console.log('Fetching your GakuNin RDM profile...');
    const me = await client.users.me();

    console.log('--- User Profile ---');
    console.log(`ID: ${me.id}`);
    console.log(`Name: ${me.full_name}`);
    console.log(`Active: ${me.active}`);
    console.log(`Locale: ${me.locale || 'Not specified'}`);
    console.log(`Profile URL: ${me.links?.html}`);
    console.log('--------------------');

    // 3. List nodes in which the user is a contributor
    console.log('\nFetching nodes in which you are engaged as a contributor...');
    const myNodes = await client.nodes.listNodes({
      'filter[contributors]': me.id,
      'page[size]': 5,
    });

    console.log(`Found ${myNodes.data.length} node(s):`);
    myNodes.data.forEach((node) => {
      console.log(`- [${node.id}] ${node.title} (${node.category})`);
    });

    // 4. Fetch GRDM project metadata for the first node
    const firstNode = myNodes.data[0];
    if (firstNode) {
      console.log(`\n--- Project Metadata (node: ${firstNode.id}) ---`);
      const projectMetadataList = await client.projectMetadata.listByNode(firstNode.id);

      if (projectMetadataList.data.length === 0) {
        console.log('No registrations found for this node.');
      } else {
        projectMetadataList.data.forEach((registration) => {
          console.log(`Registration: [${registration.id}] ${registration.title}`);
          const meta = registration.grdmMeta;
          if (meta?.projectNameJa) console.log(`  Project Name (JA): ${meta.projectNameJa}`);
          if (meta?.projectNameEn) console.log(`  Project Name (EN): ${meta.projectNameEn}`);
          if (meta?.funder) console.log(`  Funder: ${meta.funder}`);
          if (meta?.japanGrantNumber) console.log(`  Grant Number: ${meta.japanGrantNumber}`);
        });
      }

      // 5. Fetch GRDM file metadata for the first node
      console.log(`\n--- File Metadata (project: ${firstNode.id}) ---`);
      const fileMetadataResponse = await client.fileMetadata.getByProject(firstNode.id);
      const files = fileMetadataResponse.data.attributes.files;

      if (files.length === 0) {
        console.log('No file metadata found for this project.');
      } else {
        console.log(`Found ${files.length} file(s) with metadata:`);
        files.forEach((file) => {
          const activeSchema = file.items?.find((item) => item.active);
          const titleJa = activeSchema?.['grdm-file:title-ja']?.value ?? '(no title)';
          console.log(`- ${file.path}  [schema: ${activeSchema?.schema ?? 'none'}]  ${titleJa}`);
        });
      }
    }
  } catch (error) {
    console.error('An error occurred:', error instanceof Error ? error.message : error);
  }
}

main();
