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
 */
export interface GrdmFileMetadataSchema extends Record<string, any> {
  schema: string;
  active: boolean;
  // Individual fields like 'grdm-file:title-ja' will be GrdmFileMetadataField
}
