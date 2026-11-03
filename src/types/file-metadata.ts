import { GrdmFileMetadataField, GrdmPerson, GrdmPersonName } from './project-metadata';
import { Ms2MibyoDbMetadataFields } from './ms2-mibyodb-metadata';
export { Ms2MibyoDbMetadataField, Ms2MibyoDbMetadataFields } from './ms2-mibyodb-metadata';
export { SCHEMA_ID_PUBLIC_FUNDING, SCHEMA_ID_MS2_MIBYODB } from './schema-ids';
import { SCHEMA_ID_PUBLIC_FUNDING, SCHEMA_ID_MS2_MIBYODB } from './schema-ids';

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

/** A metadata field whose value is a plain string ("" when not set). */
type StringField = GrdmFileMetadataField<string | null>;
/** A metadata field whose value is a structured person name (null when not set). */
type PersonNameField = GrdmFileMetadataField<GrdmPersonName | null>;
/** A metadata field whose value is a list of persons (null when not set). */
type PersonListField = GrdmFileMetadataField<GrdmPerson[] | null>;

/**
 * The set of metadata fields nested under `data` in a GrdmFileMetadataSchema
 * for the Public Funding schema (schema ①).
 * All keys are optional: folder items, for example, omit manuscript-related keys such as `authors`.
 */
export interface GrdmFileMetadataFields {
  'grdm-file:file-type'?: StringField;
  'grdm-file:data-number'?: StringField;
  'grdm-file:doi'?: StringField;
  'grdm-file:manuscript-type'?: StringField;
  'grdm-file:title-ja'?: StringField;
  'grdm-file:title-en'?: StringField;
  'grdm-file:authors'?: PersonListField;
  'grdm-file:date-issued-updated'?: StringField;
  'grdm-file:data-description-ja'?: StringField;
  'grdm-file:data-description-en'?: StringField;
  'grdm-file:data-research-field'?: StringField;
  'grdm-file:data-type'?: StringField;
  'grdm-file:file-size'?: StringField;
  'grdm-file:data-policy-free'?: StringField;
  'grdm-file:data-policy-license'?: StringField;
  'grdm-file:data-policy-cite-ja'?: StringField;
  'grdm-file:data-policy-cite-en'?: StringField;
  'grdm-file:access-rights'?: StringField;
  'grdm-file:available-date'?: StringField;
  'grdm-file:repo-information-ja'?: StringField;
  'grdm-file:repo-information-en'?: StringField;
  'grdm-file:journal-name-ja'?: StringField;
  'grdm-file:journal-name-en'?: StringField;
  'grdm-file:date-published'?: StringField;
  'grdm-file:volume'?: StringField;
  'grdm-file:issue'?: StringField;
  'grdm-file:page-start'?: StringField;
  'grdm-file:page-end'?: StringField;
  'grdm-file:reviewed'?: StringField;
  'grdm-file:version'?: StringField;
  'grdm-file:repo-url-doi-link'?: StringField;
  'grdm-file:publication-link'?: StringField;
  'grdm-file:dataset-link'?: StringField;
  'grdm-file:hosting-inst-ja'?: StringField;
  'grdm-file:hosting-inst-en'?: StringField;
  'grdm-file:hosting-inst-id'?: StringField;
  'grdm-file:data-man-type'?: StringField;
  'grdm-file:data-man-number'?: StringField;
  'grdm-file:data-man-name-ja'?: PersonNameField;
  'grdm-file:data-man-name-en'?: PersonNameField;
  'grdm-file:data-man-org-ja'?: StringField;
  'grdm-file:data-man-org-en'?: StringField;
  'grdm-file:data-man-address-ja'?: StringField;
  'grdm-file:data-man-address-en'?: StringField;
  'grdm-file:data-man-tel'?: StringField;
  'grdm-file:data-man-email'?: StringField;
  'grdm-file:remarks-ja'?: StringField;
  'grdm-file:remarks-en'?: StringField;
  'grdm-file:metadata-access-rights'?: StringField;
  'grdm-file:creators'?: PersonListField;
}
