import { OsfRegistrationAttributes, OsfDraftRegistrationAttributes } from 'osf-api-v2-typescript';
import { Ms2ProjectRegisteredMeta } from './ms2-mibyodb-metadata';
import type { GrdmRegisteredFileMetadataFields } from './file-metadata';

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
  grdmFiles?: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields>[];
  registrationSupplement?: string;
}

/**
 * Union of all supported GRDM schema parsed metadata types.
 * Use `schemaType` as discriminator to narrow the type.
 */
export type GrdmParsedMeta = GrdmRegisteredMeta | Ms2ProjectRegisteredMeta;

/**
 * A file entry within the `grdm-files` snapshot of a draft registration / registration.
 * `TFields` is the schema-specific metadata type; the default keeps an untyped record
 * for unknown schemas.
 */
export interface GrdmRegisteredFile<TFields = Record<string, GrdmFileMetadataField>> {
  path: string;
  urlpath: string;
  /** Present in some snapshots. */
  folder?: boolean;
  metadata: TFields;
}

/**
 * Common wrapper structure for GRDM file metadata fields.
 * `T` is the type of `value`; it defaults to `unknown` for untyped fields.
 */
export interface GrdmFileMetadataField<T = unknown> {
  value: T;
  extra: unknown[];
  comments?: unknown[];
}

/**
 * A person's name as stored in GRDM file metadata
 * (`grdm-file:data-man-name-*`, and `name-ja` / `name-en` of `GrdmPerson`).
 * GRDM often stores the full name in `last` and leaves `first` and `middle` empty.
 */
export interface GrdmPersonName {
  last: string;
  first: string;
  /** Not required by the GRDM schema, but GRDM always stores it ("" when empty). */
  middle: string;
}

/**
 * One entry of `grdm-file:creators` or `grdm-file:authors` in file metadata.
 */
export interface GrdmPerson {
  number: string | null;
  'name-ja': GrdmPersonName | null;
  'name-en': GrdmPersonName | null;
  /** Present in `authors` entries ("" when empty); absent in `creators` entries. */
  'affiliation-name-ja'?: string | null;
  /** Present in `authors` entries ("" when empty); absent in `creators` entries. */
  'affiliation-name-en'?: string | null;
}

/**
 * Legacy shape of a `grdm-file:creators` entry.
 * It is not used by the current file metadata (v1 API), but it can still appear in
 * `grdm-files` snapshots of draft registrations / registrations
 * (see `GrdmRegisteredFileMetadataFields`). Use `isLegacyCreator` to narrow and
 * `normalizePerson` / `normalizeRegisteredFile` to convert to `GrdmPerson`.
 *
 * @deprecated Do not use for current file metadata or for writing back to GRDM; use `GrdmPerson`.
 * Kept to describe legacy snapshot data, so it will not be removed.
 */
export interface GrdmCreator {
  number: string | null;
  name_ja: string | null;
  name_en: string | null;
}
