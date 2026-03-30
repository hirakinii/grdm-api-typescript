import { GrdmRegisteredMeta, GrdmRegisteredFile, GrdmFileMetadataField } from '../types/project-metadata';

/**
 * Parse GRDM metadata from a raw registration_metadata / registered_meta record.
 *
 * Both registrations and draft registrations use the same { value, extra, comments }
 * wrapper structure, so this function handles both cases.
 *
 * @param metaRecord - Raw metadata record from registration_metadata or registered_meta
 * @returns Parsed GrdmRegisteredMeta object
 */
export function parseGrdmMetaRecord(metaRecord: Record<string, unknown>): GrdmRegisteredMeta {
  const meta: GrdmRegisteredMeta = {};

  const unwrap = (key: string): unknown => {
    const field = metaRecord[key];
    return field && typeof field === 'object' && 'value' in field ? field.value : undefined;
  };

  meta.funder = unwrap('funder') as string | undefined;
  meta.programNameJa = unwrap('program-name-ja') as string | undefined;
  meta.programNameEn = unwrap('program-name-en') as string | undefined;
  meta.projectNameJa = unwrap('project-name-ja') as string | undefined;
  meta.projectNameEn = unwrap('project-name-en') as string | undefined;
  meta.japanGrantNumber = unwrap('japan-grant-number') as string | undefined;
  meta.fundingStreamCode = unwrap('funding-stream-code') as string | undefined;
  meta.projectResearchField = unwrap('project-research-field') as string | undefined;

  const grdmFilesJson = unwrap('grdm-files');
  if (typeof grdmFilesJson === 'string' && grdmFilesJson) {
    try {
      const files = JSON.parse(grdmFilesJson) as Record<string, unknown>[];
      meta.grdmFiles = parseGrdmFiles(files);
    } catch {
      // Ignore parse errors
    }
  }

  return meta;
}

/**
 * Parse grdm-files metadata array into typed GrdmRegisteredFile objects.
 *
 * @param files - Array of raw file objects from the grdm-files JSON string
 * @returns Array of GrdmRegisteredFile
 */
export function parseGrdmFiles(files: Record<string, unknown>[]): GrdmRegisteredFile[] {
  return files.map((file) => {
    const metadata = { ...(file.metadata as Record<string, GrdmFileMetadataField>) };

    return {
      path: file.path as string,
      urlpath: file.urlpath as string,
      metadata,
    };
  });
}
