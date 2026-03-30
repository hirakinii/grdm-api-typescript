import { GrdmRegisteredMeta, GrdmRegisteredFile, GrdmFileMetadataField } from '../types/project-metadata';
import { Ms2ProjectRegisteredMeta, Ms2Person, Ms2Keyword } from '../types/ms2-mibyodb-metadata';

/**
 * Parse GRDM metadata from a raw registration_metadata / registered_meta record
 * for schema ① (public-funding: 66d7d4ec299c4f00071be84f).
 *
 * Both registrations and draft registrations use the same { value, extra, comments }
 * wrapper structure, so this function handles both cases.
 *
 * @param metaRecord - Raw metadata record from registration_metadata or registered_meta
 * @returns Parsed GrdmRegisteredMeta object
 */
export function parseGrdmMetaRecord(metaRecord: Record<string, unknown>): GrdmRegisteredMeta {
  const meta: GrdmRegisteredMeta = { schemaType: 'public-funding' };

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
 * Parse GRDM metadata from a raw registration_metadata record
 * for schema ② (ms2-mibyodb: 67e381081921b4000842c800).
 *
 * @param metaRecord - Raw metadata record from registration_metadata
 * @returns Parsed Ms2ProjectRegisteredMeta object
 */
export function parseMs2ProjectMetaRecord(metaRecord: Record<string, unknown>): Ms2ProjectRegisteredMeta {
  const meta: Ms2ProjectRegisteredMeta = {
    schemaType: 'ms2-mibyodb',
    checklists: {},
  };

  const unwrap = (key: string): unknown => {
    const field = metaRecord[key];
    return field && typeof field === 'object' && 'value' in field ? field.value : undefined;
  };

  meta.dataId = unwrap('data-id') as string | undefined;
  meta.projectName = unwrap('project-name') as string | undefined;
  meta.titleOfDataset = unwrap('title-of-dataset') as string | undefined;
  meta.titleOfDatasetEn = unwrap('title-of-dataset-en') as string | undefined;
  meta.datasetResearchField = unwrap('dataset-research-field') as string | undefined;
  meta.accessRights = unwrap('access-rights') as string | undefined;
  meta.dataPolicyFree = unwrap('data-policy-free') as string | undefined;
  meta.dataPolicyLicense = unwrap('data-policy-license') as string | undefined;
  meta.informedConsent = unwrap('informed-consent') as string | undefined;
  meta.anonymousProcessing = unwrap('anonymous-processing') as string | undefined;
  meta.ethicsReviewCommitteeApproval = unwrap('ethics-review-committee-approval') as string | undefined;
  meta.purposeOfExperiment = unwrap('purpose-of-experiment') as string | undefined;
  meta.purposeOfExperimentEn = unwrap('purpose-of-experiment-en') as string | undefined;
  meta.descriptionOfExperimentalCondition = unwrap('description-of-experimental-condition') as string | undefined;
  meta.descriptionOfExperimentalConditionEn = unwrap('description-of-experimental-condition-en') as string | undefined;
  meta.analysisTypeOther = unwrap('Analysis-type-other') as string | undefined;
  meta.targetTypeOfAcquiredData = unwrap('target-type-of-acquired-data') as string | undefined;
  meta.targetTypeOfAcquiredDataEn = unwrap('target-type-of-acquired-data-en') as string | undefined;
  meta.availabilityOfCommercialUse = unwrap('availability-of-commercial-use') as string | undefined;
  meta.conflictOfInterest = unwrap('conflict-of-interest-Yes-or-No') as string | undefined;
  meta.necessityOfContactAndPermission = unwrap('necessity-of-contact-and-permission') as string | undefined;
  meta.necessityOfIncludingInAcknowledgments = unwrap('necessity-of-including-in-acknowledgments') as
    | string
    | undefined;
  meta.namesToBeIncludedInAcknowledgments = unwrap('names-to-be-included-in-the-acknowledgments') as string | undefined;
  meta.namesToBeIncludedInAcknowledgmentsEn = unwrap('names-to-be-included-in-the-acknowledgments-en') as
    | string
    | undefined;
  meta.repositoryInformation = unwrap('repository-information') as string | undefined;
  meta.repositoryUrlDoiLink = unwrap('repository-url-doi-link') as string | undefined;
  meta.dateRegisteredInMetadata = unwrap('date-registered-in-metadata') as string | undefined;
  meta.dateUpdatedInMetadata = unwrap('date-updated-in-metadata') as string | undefined;
  meta.disclaimerVersion = unwrap('disclaimer-version') as string | undefined;
  meta.disclaimerCheckDate = unwrap('disclaimer-check-date') as string | undefined;

  // Analysis-type is an array value
  const analysisType = unwrap('Analysis-type');
  if (Array.isArray(analysisType)) {
    meta.analysisType = analysisType as string[];
  }

  // keywords: JSON string of [{filename, filename-en}]
  const keywordsJson = unwrap('keywords');
  if (typeof keywordsJson === 'string' && keywordsJson) {
    try {
      const raw = JSON.parse(keywordsJson) as Record<string, string>[];
      meta.keywords = raw.map(
        (k): Ms2Keyword => ({
          filename: k['filename'] ?? '',
          filenameEn: k['filename-en'] ?? '',
        }),
      );
    } catch {
      // Ignore parse errors
    }
  }

  // data-creator: JSON string of [{name, name-en, belonging, belonging-en, contact}]
  const dataCreatorJson = unwrap('data-creator');
  if (typeof dataCreatorJson === 'string' && dataCreatorJson) {
    try {
      const raw = JSON.parse(dataCreatorJson) as Record<string, string>[];
      meta.dataCreators = raw.map(parseMs2Person);
    } catch {
      // Ignore parse errors
    }
  }

  // data-manager: same shape as data-creator
  const dataManagerJson = unwrap('data-manager');
  if (typeof dataManagerJson === 'string' && dataManagerJson) {
    try {
      const raw = JSON.parse(dataManagerJson) as Record<string, string>[];
      meta.dataManagers = raw.map(parseMs2Person);
    } catch {
      // Ignore parse errors
    }
  }

  // grdm-files: same JSON format as schema ①
  const grdmFilesJson = unwrap('grdm-files');
  if (typeof grdmFilesJson === 'string' && grdmFilesJson) {
    try {
      const files = JSON.parse(grdmFilesJson) as Record<string, unknown>[];
      meta.grdmFiles = parseGrdmFiles(files);
    } catch {
      // Ignore parse errors
    }
  }

  // Checklist1–Checklist13
  const checklists: Record<string, string[]> = {};
  for (let i = 1; i <= 13; i++) {
    const key = `Checklist${i}`;
    const value = unwrap(key);
    if (Array.isArray(value)) {
      checklists[key] = value as string[];
    }
  }
  meta.checklists = checklists;

  return meta;
}

/**
 * Parse a raw person object from data-creator / data-manager JSON.
 */
function parseMs2Person(raw: Record<string, string>): Ms2Person {
  return {
    name: raw['name'] ?? '',
    nameEn: raw['name-en'] ?? '',
    belonging: raw['belonging'] ?? '',
    belongingEn: raw['belonging-en'] ?? '',
    contact: raw['contact'] ?? '',
  };
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
