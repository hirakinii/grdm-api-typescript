/**
 * Example: Fetch project metadata and file metadata for a GakuNin RDM project.
 *
 * Usage:
 *   GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch-project-and-file-metadata.ts
 *
 * Environment variables:
 *   GRDM_TOKEN   - Your GakuNin RDM personal access token (required)
 *   GRDM_NODE_ID - The project (node) ID to fetch metadata for (required)
 *   GRDM_BASE_URL - Optional: Override the v2 API base URL (default: https://api.rdm.nii.ac.jp/v2/)
 */

import { GrdmClient } from '../src/client';
import {
  GrdmFileItem,
  GrdmFileMetadataFields,
  Ms2MibyoDbMetadataFields,
  SCHEMA_ID_MS2_MIBYODB,
  SCHEMA_ID_PUBLIC_FUNDING,
} from '../src/types/file-metadata';
import { GrdmPerson } from '../src/types/project-metadata';
import { formatPersonName } from '../src/utils/personName';

/**
 * Format a creators / authors entry for display.
 * Prefers the Japanese name and falls back to the English name when it is null.
 */
function formatPerson(person: GrdmPerson): string {
  const nameJa = formatPersonName(person['name-ja'], 'ja');
  const nameEn = formatPersonName(person['name-en'], 'en');
  return `[${person.number || '?'}] ${nameJa || '-'} / ${nameEn || '-'}`;
}

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
  // 1. Fetch public funding file metadata for the given project (v1 API)
  // ----------------------------------------------------------------
  console.log(`\n=== Public Funding File Metadata (project: ${nodeId}) ===\n`);

  const publicFileMetadataResponse = await client.fileMetadata.getByProject(nodeId);
  let files: GrdmFileItem[] = [];

  for (const file of publicFileMetadataResponse.data.attributes.files) {
    const activeSchema = file.items?.find((item) => item.active);
    if (!activeSchema) continue;
    if (activeSchema?.schema === SCHEMA_ID_PUBLIC_FUNDING) {
      files.push(file);
    }
  }
  if (files.length === 0) {
    console.log('No public funding file metadata found for this project.');
  } else {
    console.log(`Found ${files.length} file(s) with public funding metadata:\n`);

    for (const file of files) {
      console.log(`Path    : ${file.path}`);
      console.log(`Folder  : ${file.folder}`);
      console.log(`URLPath : ${file.urlpath}`);
      const activeSchema = file.items?.find((item) => item.active);
      if (activeSchema) {
        console.log(`Schema  : ${activeSchema.schema}`);
        const fileMetadataData = activeSchema?.data as GrdmFileMetadataFields;
        const fileType = fileMetadataData['grdm-file:file-type']?.value;
        const titleJa = fileMetadataData['grdm-file:title-ja']?.value;
        const titleEn = fileMetadataData['grdm-file:title-en']?.value;
        const dataType = fileMetadataData['grdm-file:data-type']?.value;
        const dataResearchField = fileMetadataData['grdm-file:data-research-field']?.value;
        const accessRights = fileMetadataData['grdm-file:access-rights']?.value;
        const creators = fileMetadataData['grdm-file:creators']?.value;
        const authors = fileMetadataData['grdm-file:authors']?.value;
        const dataManagerJa = formatPersonName(fileMetadataData['grdm-file:data-man-name-ja']?.value, 'ja');
        const dataManagerEn = formatPersonName(fileMetadataData['grdm-file:data-man-name-en']?.value, 'en');

        if (fileType) console.log(`File type      : ${fileType}`);
        if (titleJa) console.log(`Title (JA)     : ${titleJa}`);
        if (titleEn) console.log(`Title (EN)     : ${titleEn}`);
        if (dataType) console.log(`Data Type      : ${dataType}`);
        if (dataResearchField) console.log(`Data Research Field: ${dataResearchField}`);
        if (accessRights) console.log(`Access Rights  : ${accessRights}`);
        if (dataManagerJa || dataManagerEn) {
          console.log(`Data Manager   : ${dataManagerJa || '-'} / ${dataManagerEn || '-'}`);
        }
        if (creators && creators.length > 0) {
          console.log(`Creators:`);
          for (const creator of creators) {
            console.log(`  - ${formatPerson(creator)}`);
          }
        }
        if (authors && authors.length > 0) {
          console.log(`Authors:`);
          for (const author of authors) {
            console.log(`  - ${formatPerson(author)}`);
          }
        }
        if (fileType && fileType === 'manuscript') {
          const reviewed = fileMetadataData['grdm-file:reviewed']?.value;
          const manuscriptType = fileMetadataData['grdm-file:manuscript-type']?.value;
          console.log(`reviewed        : ${reviewed}`);
          console.log(`Manuscript Type : ${manuscriptType}`);
        }
      } else {
        console.log('(No active metadata schema)');
      }

      console.log('');
    }
  }

  // ----------------------------------------------------------------
  // 2. Fetch MS2 funding file metadata for the given project (v1 API)
  // ----------------------------------------------------------------
  console.log(`\n=== MS2 Funding File Metadata (project: ${nodeId}) ===\n`);

  const ms2FileMetadataResponse = await client.fileMetadata.getByProject(nodeId);
  files = [];

  for (const file of ms2FileMetadataResponse.data.attributes.files) {
    const activeSchema = file.items?.find((item) => item.active);
    if (!activeSchema) continue;
    if (activeSchema?.schema === SCHEMA_ID_MS2_MIBYODB) {
      files.push(file);
    }
  }

  if (files.length === 0) {
    console.log('No MS2 funding file metadata found for this project.');
  } else {
    console.log(`Found ${files.length} file(s) with MS2 funding metadata:\n`);

    for (const file of files) {
      console.log(`Path    : ${file.path}`);
      console.log(`Folder  : ${file.folder}`);
      console.log(`URLPath : ${file.urlpath}`);

      const activeSchema = file.items?.find((item) => item.active);
      if (activeSchema) {
        console.log(`Schema  : ${activeSchema.schema}`);
        const fileMetadataData = activeSchema?.data as Ms2MibyoDbMetadataFields;
        const labelExplanation = fileMetadataData['grdm-file:Label-explanation']?.value;
        const objectOfMeasurementJp = fileMetadataData['grdm-file:d-msr-object-of-measurement-jp']?.value;
        const objectOfMeasurementEn = fileMetadataData['grdm-file:d-msr-object-of-measurement-en']?.value;
        const msrDataTypeJp = fileMetadataData['grdm-file:d-msr-data-type-jp']?.value;

        if (labelExplanation) console.log(`labelExplanation      : ${labelExplanation}`);
        if (objectOfMeasurementJp) console.log(`Object of Measurement (JA)     : ${objectOfMeasurementJp}`);
        if (objectOfMeasurementEn) console.log(`Object of Measurement (EN)     : ${objectOfMeasurementEn}`);
        if (msrDataTypeJp) console.log(`Measurement Data Type (JA)     : ${msrDataTypeJp}`);
      }
    }
  }
}

main().catch((err: unknown) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
