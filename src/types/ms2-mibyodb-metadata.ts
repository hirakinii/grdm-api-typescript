import { GrdmFileMetadataField, GrdmRegisteredFile } from './project-metadata';

/**
 * A person entry in data-creator or data-manager fields of the MS2 Mibyodb schema.
 */
export interface Ms2Person {
  name: string;
  nameEn: string;
  belonging: string;
  belongingEn: string;
  contact: string;
}

/**
 * A keyword entry in the keywords field of the MS2 Mibyodb schema.
 */
export interface Ms2Keyword {
  filename: string;
  filenameEn: string;
}

/**
 * Parsed project-level metadata for schema "67e381081921b4000842c800":
 * ムーンショット目標2データベース（未病DB）のメタデータ
 */
export interface Ms2ProjectRegisteredMeta {
  schemaType: 'ms2-mibyodb';
  dataId?: string;
  keywords?: Ms2Keyword[];
  projectName?: string;
  titleOfDataset?: string;
  titleOfDatasetEn?: string;
  dataCreators?: Ms2Person[];
  dataManagers?: Ms2Person[];
  datasetResearchField?: string;
  accessRights?: string;
  dataPolicyFree?: string;
  dataPolicyLicense?: string;
  informedConsent?: string;
  anonymousProcessing?: string;
  ethicsReviewCommitteeApproval?: string;
  purposeOfExperiment?: string;
  purposeOfExperimentEn?: string;
  descriptionOfExperimentalCondition?: string;
  descriptionOfExperimentalConditionEn?: string;
  analysisType?: string[];
  analysisTypeOther?: string;
  targetTypeOfAcquiredData?: string;
  targetTypeOfAcquiredDataEn?: string;
  availabilityOfCommercialUse?: string;
  conflictOfInterest?: string;
  necessityOfContactAndPermission?: string;
  necessityOfIncludingInAcknowledgments?: string;
  namesToBeIncludedInAcknowledgments?: string;
  namesToBeIncludedInAcknowledgmentsEn?: string;
  repositoryInformation?: string;
  repositoryUrlDoiLink?: string;
  dateRegisteredInMetadata?: string;
  dateUpdatedInMetadata?: string;
  disclaimerVersion?: string;
  disclaimerCheckDate?: string;
  grdmFiles?: GrdmRegisteredFile<Ms2MibyoDbMetadataFields>[];
  /** Checklist1–Checklist13 entries keyed by field name */
  checklists?: Record<string, string[]>;
}

/**
 * A metadata field of the MS2 Mibyodb schema.
 * `T` defaults to `string | null`, used by text, textarea and single-select fields ("" when not set)
 * and by the `Label-*` section headings (always null).
 */
export interface Ms2MibyoDbMetadataField<T = string | null> extends GrdmFileMetadataField<T> {
  comments: unknown[];
}

/** An element of `grdm-file:d-msr-measuring-device-name`. */
export interface Ms2MeasuringDevice {
  'Measuring-device-name': string;
  'Measuring-device-name-en': string;
}

/** An element of `grdm-file:d-msr-procedure`. */
export interface Ms2Procedure {
  Procedure: string;
  'Procedure-en': string;
}

/** An element of `grdm-file:d-msr-user-defined-metadata-items` / `grdm-file:t-abt-user-defined-metadata-items`. */
export interface Ms2UserDefinedMetadataItem {
  'Metadata-item-name': string;
  'value-or-content': string;
  'Metadata-item-name-en': string;
  'value-or-content-en': string;
}

/** An element of `grdm-file:d-fol-Structure-or-descriptions-of-folders-jp`. */
export interface Ms2FolderDescription {
  'folder-name': string;
  'description-of-folder': string;
  'description-of-folder-en': string;
  contents: string;
}

/** An element of `grdm-file:d-{txt,exl,img,abt}-file-name-convention-file-extension`. */
export interface Ms2FileNameConvention {
  'storage-folder': string;
  'file-name-convention-file-extension': string;
}

/** An element of `grdm-file:d-{txt,exl}-description-of-row` / `grdm-file:d-{txt,exl}-description-of-column`. */
export interface Ms2TermDescription {
  'Position-of-row': string;
  'Name-of-term': string;
  'Description-of-term': string;
  'Position-of-row-en': string;
  'Name-of-term-en': string;
  'Description-of-term-en': string;
}

/**
 * Metadata fields for schema "67e381081921b4000842c800":
 * ムーンショット目標2データベース（未病DB）のメタデータ
 *
 * The 90 fields follow the GRDM schema definition (`schema_version` 2):
 * - 13 table fields hold arrays of objects (`<Element>[] | null`; `null` when not set).
 *   Every element has all of its properties, with "" for empty cells.
 * - Text, textarea and single-select fields are `string | null` ("" when not set).
 * - The `Label-*` section headings are always `null`.
 */
export interface Ms2MibyoDbMetadataFields {
  // Measurement section
  'grdm-file:Label-explanation'?: Ms2MibyoDbMetadataField;
  'grdm-file:Label-measurement'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-object-of-measurement-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-object-of-measurement-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-target-organs-for-measurement'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-data-type-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-data-type-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-classification-of-measuring-devices-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-classification-of-measuring-devices-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-measuring-device-name'?: Ms2MibyoDbMetadataField<Ms2MeasuringDevice[] | null>;
  'grdm-file:d-msr-procedure'?: Ms2MibyoDbMetadataField<Ms2Procedure[] | null>;
  'grdm-file:d-msr-user-defined-metadata-items'?: Ms2MibyoDbMetadataField<Ms2UserDefinedMetadataItem[] | null>;
  'grdm-file:d-msr-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-remarks-en'?: Ms2MibyoDbMetadataField;
  // Folder section
  'grdm-file:Label-folder'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-Structure-or-descriptions-of-folders-jp'?: Ms2MibyoDbMetadataField<Ms2FolderDescription[] | null>;
  'grdm-file:d-fol-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-remarks-en'?: Ms2MibyoDbMetadataField;
  // Text file section
  'grdm-file:Label-text'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField<Ms2FileNameConvention[] | null>;
  'grdm-file:d-txt-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-of-row'?: Ms2MibyoDbMetadataField<Ms2TermDescription[] | null>;
  'grdm-file:d-txt-description-of-column'?: Ms2MibyoDbMetadataField<Ms2TermDescription[] | null>;
  'grdm-file:d-txt-data-preprocessing-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-data-preprocessing-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-temporal-measurement-data'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-number-of-rows'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-number-of-columns'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-approximate-number-of-similar-files'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-txt-delimiter'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-txt-character-code'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-txt-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-txt-remarks-en'?: Ms2MibyoDbMetadataField;
  // Excel file section
  'grdm-file:Label-excel'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField<Ms2FileNameConvention[] | null>;
  'grdm-file:d-exl-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-of-row'?: Ms2MibyoDbMetadataField<Ms2TermDescription[] | null>;
  'grdm-file:d-exl-description-of-column'?: Ms2MibyoDbMetadataField<Ms2TermDescription[] | null>;
  'grdm-file:d-exl-data-preprocessing-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-data-preprocessing-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-temporal-measurement-data'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-number-of-rows'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-number-of-columns'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-approximate-number-of-similar-files'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-exl-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-exl-remarks-en'?: Ms2MibyoDbMetadataField;
  // Image file section
  'grdm-file:Label-image'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField<Ms2FileNameConvention[] | null>;
  'grdm-file:d-img-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-data-preprocessing-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-data-preprocessing-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-temporal-measurement-data'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-pixel-width'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-pixel-height'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-resolution-horizontal'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-resolution-vertical'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-Color-Monochrome'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-number-of-color-bit'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-compression-format'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-img-approximate-number-of-similar-files'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-image-type'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-img-remarks-en'?: Ms2MibyoDbMetadataField;
  // Any file (arbitrary format) section
  'grdm-file:Label-any'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField<Ms2FileNameConvention[] | null>;
  'grdm-file:d-abt-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-data-preprocessing-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-data-preprocessing-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-temporal-measurement-data'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-number-of-rows'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-number-of-columns'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-approximate-number-of-similar-files'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-text/binary'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-image-type'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-pixel-width'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-pixel-height'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-resolution-horizontal'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-abt-resolution-vertical'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-Color-Monochrome'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-number-of-color-bit'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-compression-format'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-delimiter'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-character-code'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-user-defined-metadata-items'?: Ms2MibyoDbMetadataField<Ms2UserDefinedMetadataItem[] | null>;
  'grdm-file:t-abt-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-remarks-en'?: Ms2MibyoDbMetadataField;
}
