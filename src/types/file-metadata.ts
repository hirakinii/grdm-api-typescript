import { GrdmFileMetadataField } from './project-metadata';

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
 * A metadata schema associated with a file item.
 * Contains the actual metadata fields.
 * Based on Section 5.2 of the specification.
 */
export interface GrdmFileMetadataSchema extends Record<string, unknown> {
  schema: string;
  active: boolean;
  'grdm-file:data-number'?: GrdmFileMetadataField;
  'grdm-file:title-ja'?: GrdmFileMetadataField;
  'grdm-file:title-en'?: GrdmFileMetadataField;
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
  'grdm-file:repo-url-doi-link'?: GrdmFileMetadataField;
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
