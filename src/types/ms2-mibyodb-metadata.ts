import { GrdmFileMetadataField } from './project-metadata';

/**
 * A metadata field specific to the MS2 Mibyodb schema.
 * All values are constrained to string | null, unlike the general GrdmFileMetadataField.
 */
export interface Ms2MibyoDbMetadataField extends GrdmFileMetadataField {
  value: string | null;
  comments: unknown[];
}

/**
 * Metadata fields for schema "67e381081921b4000842c800":
 * ムーンショット目標2データベース（未病DB）のメタデータ
 * All 84 fields have value type string | null.
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
  'grdm-file:d-msr-measuring-device-name'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-procedure'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-user-defined-metadata-items'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-msr-remarks-en'?: Ms2MibyoDbMetadataField;
  // Folder section
  'grdm-file:Label-folder'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-Structure-or-descriptions-of-folders-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-remarks-en'?: Ms2MibyoDbMetadataField;
  // Text file section
  'grdm-file:Label-text'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-of-row'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-txt-description-of-column'?: Ms2MibyoDbMetadataField;
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
  'grdm-file:d-exl-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-en'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-of-row'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-exl-description-of-column'?: Ms2MibyoDbMetadataField;
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
  'grdm-file:d-img-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField;
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
  'grdm-file:d-abt-file-name-convention-file-extension'?: Ms2MibyoDbMetadataField;
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
  'grdm-file:t-abt-user-defined-metadata-items'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:t-abt-remarks-en'?: Ms2MibyoDbMetadataField;
}
