import { GrdmFileMetadataField } from './project-metadata';
import { Ms2MibyoDbMetadataFields } from './ms2-mibyodb-metadata';
export { Ms2MibyoDbMetadataField, Ms2MibyoDbMetadataFields } from './ms2-mibyodb-metadata';

/**
 * Schema ID for the Public Funding Research Data Metadata schema (schema ①).
 * 公的資金による研究データのメタデータ
 */
export const SCHEMA_ID_PUBLIC_FUNDING = '66d7d4ec299c4f00071be84f' as const;

/**
 * Schema ID for the MS2 Mibyodb Metadata schema (schema ②).
 * ムーンショット目標2データベース（未病DB）のメタデータ
 */
export const SCHEMA_ID_MS2_MIBYODB = '67e381081921b4000842c800' as const;

/**
 * Response structure for the v1 file metadata API.
 */
export interface GrdmFileMetadataResponse {
  data: GrdmFileMetadataProject;
}

export interface GrdmFileMetadataProject {
  id: string;
  type: string;
  attributes: GrdmFileMetadataAttributes;
}

export interface GrdmFileMetadataAttributes {
  editable: boolean;
  features: Record<string, boolean>;
  files: GrdmFileItem[];
}

export interface GrdmFileItem {
  path: string;
  hash: string | null;
  folder: boolean;
  urlpath: string;
  generated: boolean;
  items: GrdmFileMetadataSchema[];
}

/**
 * Union of all supported schema data types.
 * When a new schema is added, extend this union with the new fields type.
 */
export type GrdmFileMetadataData = GrdmFileMetadataFields | Ms2MibyoDbMetadataFields;

/**
 * A metadata schema associated with a file item.
 * The metadata fields are nested under the `data` property,
 * matching the actual GRDM v1 API response structure.
 * Based on Section 5.2 of the specification.
 *
 * To access schema-specific fields in a type-safe manner, use the type guard
 * functions `isPublicFundingSchema` or `isMs2MibyoDbSchema` to narrow the type.
 */
export interface GrdmFileMetadataSchema {
  schema: string;
  active: boolean;
  data: GrdmFileMetadataData;
}

/**
 * Narrowed schema interface for the Public Funding schema (schema ①).
 * Use `isPublicFundingSchema` to narrow a `GrdmFileMetadataSchema` to this type.
 */
export interface PublicFundingFileMetadataSchema extends GrdmFileMetadataSchema {
  schema: typeof SCHEMA_ID_PUBLIC_FUNDING;
  data: GrdmFileMetadataFields;
}

/**
 * Narrowed schema interface for the MS2 Mibyodb schema (schema ②).
 * Use `isMs2MibyoDbSchema` to narrow a `GrdmFileMetadataSchema` to this type.
 */
export interface Ms2MibyoDbFileMetadataSchema extends GrdmFileMetadataSchema {
  schema: typeof SCHEMA_ID_MS2_MIBYODB;
  data: Ms2MibyoDbMetadataFields;
}

/**
 * Type guard: narrows a GrdmFileMetadataSchema to PublicFundingFileMetadataSchema.
 * Returns true when the schema ID matches the Public Funding schema (schema ①).
 */
export function isPublicFundingSchema(s: GrdmFileMetadataSchema): s is PublicFundingFileMetadataSchema {
  return s.schema === SCHEMA_ID_PUBLIC_FUNDING;
}

/**
 * Type guard: narrows a GrdmFileMetadataSchema to Ms2MibyoDbFileMetadataSchema.
 * Returns true when the schema ID matches the MS2 Mibyodb schema (schema ②).
 */
export function isMs2MibyoDbSchema(s: GrdmFileMetadataSchema): s is Ms2MibyoDbFileMetadataSchema {
  return s.schema === SCHEMA_ID_MS2_MIBYODB;
}

/**
 * The set of metadata fields nested under `data` in a GrdmFileMetadataSchema
 * for the Public Funding schema (schema ①).
 */
export interface GrdmFileMetadataFields {
  'grdm-file:file-type'?: GrdmFileMetadataField;
  'grdm-file:data-number'?: GrdmFileMetadataField;
  'grdm-file:doi'?: GrdmFileMetadataField;
  'grdm-file:manuscript-type'?: GrdmFileMetadataField;
  'grdm-file:title-ja'?: GrdmFileMetadataField;
  'grdm-file:title-en'?: GrdmFileMetadataField;
  'grdm-file:authors'?: GrdmFileMetadataField;
  'grdm-file:date-issued-updated'?: GrdmFileMetadataField;
  'grdm-file:data-description-ja'?: GrdmFileMetadataField;
  'grdm-file:data-description-en'?: GrdmFileMetadataField;
  'grdm-file:data-research-field'?: GrdmFileMetadataField;
  'grdm-file:data-type'?: GrdmFileMetadataField;
  'grdm-file:file-size'?: GrdmFileMetadataField;
  'grdm-file:data-policy-free'?: GrdmFileMetadataField;
  'grdm-file:data-policy-license'?: GrdmFileMetadataField;
  'grdm-file:data-policy-cite-ja'?: GrdmFileMetadataField;
  'grdm-file:data-policy-cite-en'?: GrdmFileMetadataField;
  'grdm-file:access-rights'?: GrdmFileMetadataField;
  'grdm-file:available-date'?: GrdmFileMetadataField;
  'grdm-file:repo-information-ja'?: GrdmFileMetadataField;
  'grdm-file:repo-information-en'?: GrdmFileMetadataField;
  'grdm-file:journal-name-ja'?: GrdmFileMetadataField;
  'grdm-file:journal-name-en'?: GrdmFileMetadataField;
  'grdm-file:date-published'?: GrdmFileMetadataField;
  'grdm-file:volume'?: GrdmFileMetadataField;
  'grdm-file:issue'?: GrdmFileMetadataField;
  'grdm-file:page-start'?: GrdmFileMetadataField;
  'grdm-file:page-end'?: GrdmFileMetadataField;
  'grdm-file:reviewed'?: GrdmFileMetadataField;
  'grdm-file:version'?: GrdmFileMetadataField;
  'grdm-file:repo-url-doi-link'?: GrdmFileMetadataField;
  'grdm-file:publication-link'?: GrdmFileMetadataField;
  'grdm-file:dataset-link'?: GrdmFileMetadataField;
  'grdm-file:hosting-inst-ja'?: GrdmFileMetadataField;
  'grdm-file:hosting-inst-en'?: GrdmFileMetadataField;
  'grdm-file:hosting-inst-id'?: GrdmFileMetadataField;
  'grdm-file:data-man-type'?: GrdmFileMetadataField;
  'grdm-file:data-man-number'?: GrdmFileMetadataField;
  'grdm-file:data-man-name-ja'?: GrdmFileMetadataField;
  'grdm-file:data-man-name-en'?: GrdmFileMetadataField;
  'grdm-file:data-man-org-ja'?: GrdmFileMetadataField;
  'grdm-file:data-man-org-en'?: GrdmFileMetadataField;
  'grdm-file:data-man-address-ja'?: GrdmFileMetadataField;
  'grdm-file:data-man-address-en'?: GrdmFileMetadataField;
  'grdm-file:data-man-tel'?: GrdmFileMetadataField;
  'grdm-file:data-man-email'?: GrdmFileMetadataField;
  'grdm-file:remarks-ja'?: GrdmFileMetadataField;
  'grdm-file:remarks-en'?: GrdmFileMetadataField;
  'grdm-file:metadata-access-rights'?: GrdmFileMetadataField;
  'grdm-file:creators'?: GrdmFileMetadataField;
}
