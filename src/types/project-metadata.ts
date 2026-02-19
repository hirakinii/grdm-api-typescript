/**
 * Metadata fields stored in the `registered_meta` / `registration_responses`
 * attributes of a registration resource.
 */
export interface GrdmRegisteredMeta {
  funder?: string;
  programNameJa?: string;
  programNameEn?: string;
  projectNameJa?: string;
  projectNameEn?: string;
  japanGrantNumber?: string;
  fundingStreamCode?: string;
  projectResearchField?: string;
  grdmFiles?: GrdmRegisteredFile[];
  registrationSupplement?: string;
}

/**
 * Represents a file entry within the `grdm-files` field of `registered_meta`.
 */
export interface GrdmRegisteredFile {
  path: string;
  urlpath: string;
  metadata: Record<string, GrdmFileMetadataField>;
}

/**
 * Common wrapper structure for GRDM file metadata fields.
 */
export interface GrdmFileMetadataField {
  value: string | null;
  extra: unknown[];
  comments?: unknown[];
}

/**
 * Represents a creator in file metadata.
 */
export interface GrdmCreator {
  number: string | null;
  nameJa: string | null;
  nameEn: string | null;
}
