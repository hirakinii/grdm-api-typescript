import { OsfRegistrationAttributes, OsfDraftRegistrationAttributes } from 'osf-api-v2-typescript';
import { Ms2ProjectRegisteredMeta } from './ms2-mibyodb-metadata';

/**
 * GRDM-specific extension of the registration_schema relationship.
 * The base library type only has `links`; GRDM also provides `data.id`.
 */
export interface GrdmRegistrationSchemaRelationship {
  data?: { id: string; type: string };
  links?: { related: { href: string } };
}

/**
 * Extended registration attributes including parsed GRDM metadata.
 * Only schema ① (public-funding) is supported for registrations.
 */
export interface GrdmProjectMetadataAttributes extends OsfRegistrationAttributes {
  grdmMeta?: GrdmRegisteredMeta;
}

/**
 * Extended draft registration attributes including parsed GRDM metadata.
 * Supports both schema ① (public-funding) and schema ② (ms2-mibyodb).
 */
export interface GrdmDraftProjectMetadataAttributes extends OsfDraftRegistrationAttributes {
  grdmMeta?: GrdmParsedMeta;
}

/**
 * Metadata fields stored in the `registered_meta` / `registration_responses`
 * attributes of a registration resource (schema ①: public-funding).
 */
export interface GrdmRegisteredMeta {
  schemaType: 'public-funding';
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
 * Union of all supported GRDM schema parsed metadata types.
 * Use `schemaType` as discriminator to narrow the type.
 */
export type GrdmParsedMeta = GrdmRegisteredMeta | Ms2ProjectRegisteredMeta;

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
  value: unknown;
  extra: unknown[];
  comments?: unknown[];
}

/**
 * Represents a creator in file metadata.
 */
export interface GrdmCreator {
  number: string | null;
  name_ja: string | null;
  name_en: string | null;
}
