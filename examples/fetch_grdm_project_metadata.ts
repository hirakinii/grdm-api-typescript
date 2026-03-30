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
import { GrdmRegisteredMeta } from '../src/types/project-metadata';
import { Ms2ProjectRegisteredMeta } from '../src/types/ms2-mibyodb-metadata';

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
  //    Only schema ① (public-funding) is supported for registrations.
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
        printPublicFundingMeta(meta);
      }

      console.log('');
    }

    if (projectMetadataList.links?.next) {
      console.log('(More registrations available — pagination not shown in this example.)');
    }
  }

  // ----------------------------------------------------------------
  // 2. Fetch project metadata (draft registrations) for the given node
  //    Supports schema ① (public-funding) and schema ② (ms2-mibyodb).
  // ----------------------------------------------------------------
  console.log(`\n=== Draft Project Metadata (node: ${nodeId}) ===\n`);

  const draftMetadataList = await client.draftProjectMetadata.listByNode(nodeId);

  if (draftMetadataList.data.length === 0) {
    console.log('No draft registrations found for this node.');
  } else {
    for (const draft of draftMetadataList.data) {
      console.log(`Draft ID        : ${draft.id}`);
      console.log(`Title           : ${draft.title}`);
      console.log(`Last Updated    : ${draft.datetime_updated}`);

      const meta = draft.grdmMeta;
      if (meta) {
        if (meta.schemaType === 'public-funding') {
          printPublicFundingMeta(meta);
        } else if (meta.schemaType === 'ms2-mibyodb') {
          printMs2MibyoDbMeta(meta);
        }
      }

      console.log('');
    }

    if (draftMetadataList.links?.next) {
      console.log('(More draft registrations available — pagination not shown in this example.)');
    }
  }
}

/** Print parsed metadata for schema ①: 公的資金に研究データのメタデータ */
function printPublicFundingMeta(meta: GrdmRegisteredMeta): void {
  if (meta.funder) console.log(`Funder          : ${meta.funder}`);
  if (meta.projectNameJa) console.log(`Project Name (JA): ${meta.projectNameJa}`);
  if (meta.projectNameEn) console.log(`Project Name (EN): ${meta.projectNameEn}`);
  if (meta.programNameJa) console.log(`Program Name (JA): ${meta.programNameJa}`);
  if (meta.programNameEn) console.log(`Program Name (EN): ${meta.programNameEn}`);
  if (meta.japanGrantNumber) console.log(`Grant Number    : ${meta.japanGrantNumber}`);
  if (meta.projectResearchField) console.log(`Research Field  : ${meta.projectResearchField}`);
  printGrdmFiles(meta);
}

/** Print parsed metadata for schema ②: ムーンショット目標2データベース（未病DB）のメタデータ */
function printMs2MibyoDbMeta(meta: Ms2ProjectRegisteredMeta): void {
  if (meta.projectName) console.log(`Project Name    : ${meta.projectName}`);
  if (meta.titleOfDataset) console.log(`Dataset Title   : ${meta.titleOfDataset}`);
  if (meta.datasetResearchField) console.log(`Research Field  : ${meta.datasetResearchField}`);
  if (meta.accessRights) console.log(`Access Rights   : ${meta.accessRights}`);
  if (meta.dataPolicyLicense) console.log(`License         : ${meta.dataPolicyLicense}`);
  if (meta.purposeOfExperiment) console.log(`Purpose         : ${meta.purposeOfExperiment}`);
  if (meta.dateRegisteredInMetadata) console.log(`Registered Date : ${meta.dateRegisteredInMetadata}`);

  if (meta.dataCreators && meta.dataCreators.length > 0) {
    console.log(`Data Creators   :`);
    for (const person of meta.dataCreators) {
      console.log(`  - ${person.name} (${person.nameEn}) <${person.contact}>`);
    }
  }

  if (meta.keywords && meta.keywords.length > 0) {
    const kws = meta.keywords.map((k) => k.filename).join(', ');
    console.log(`Keywords        : ${kws}`);
  }

  printGrdmFiles(meta);
}

/** Print grdm-files summary (shared between schemas) */
function printGrdmFiles(meta: Pick<GrdmRegisteredMeta | Ms2ProjectRegisteredMeta, 'grdmFiles'>): void {
  if (meta.grdmFiles && meta.grdmFiles.length > 0) {
    console.log(`Registered Files: ${meta.grdmFiles.length} file(s)`);
    for (const file of meta.grdmFiles) {
      console.log(`  - ${file.path}`);
    }
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
