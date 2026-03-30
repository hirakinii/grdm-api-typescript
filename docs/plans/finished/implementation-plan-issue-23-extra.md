# Implementation Plan: Issue #23 Extra — Add MS2 Mibyodb Schema (②) Support

## Overview

Add support for the "ムーンショット目標2データベース（未病DB）のメタデータ" schema (②) in `DraftProjectMetadata`.

- Schema ①: `registration_schema.data.id = "66d7d4ec299c4f00071be84f"` — 公的資金に研究データのメタデータ（already supported）
- Schema ②: `registration_schema.data.id = "67e381081921b4000842c800"` — ムーンショット目標2データベース（未病DB）のメタデータ（new）

Reference response: `docs/reference/draft_registration_sample_ms2.json`

---

## Key Findings

### TransformedResource structure
`JsonApiAdapter.transformSingle/transformList` flattens `attributes` to the top level and preserves:
- `id`, `type`
- `relationships?: Record<string, unknown>` ← schema ID is here
- `links?: Record<string, string>`

### Schema ID location in GRDM API response
```
relationships.registration_schema.data.id  →  schema ID string
```
The library type has `registration_schema: { links: { related: { href: string } } }` (no `data`).
GRDM extends this with `data: { id: string; type: string }`.

---

## Schema ② Fields (registration_metadata top-level)

| Field key | Type | Parsed as |
|---|---|---|
| `project-name` | string | `projectName` |
| `title-of-dataset` | string | `titleOfDataset` |
| `title-of-dataset-en` | string | `titleOfDatasetEn` |
| `data-creator` | JSON string | `dataCreators: Ms2Person[]` |
| `data-manager` | JSON string | `dataManagers: Ms2Person[]` |
| `keywords` | JSON string | `keywords: Ms2Keyword[]` |
| `dataset-research-field` | string | `datasetResearchField` |
| `access-rights` | string | `accessRights` |
| `data-policy-free` | string | `dataPolicyFree` |
| `data-policy-license` | string | `dataPolicyLicense` |
| `informed-consent` | string | `informedConsent` |
| `anonymous-processing` | string | `anonymousProcessing` |
| `ethics-review-committee-approval` | string | `ethicsReviewCommitteeApproval` |
| `purpose-of-experiment` | string | `purposeOfExperiment` |
| `purpose-of-experiment-en` | string | `purposeOfExperimentEn` |
| `description-of-experimental-condition` | string | `descriptionOfExperimentalCondition` |
| `description-of-experimental-condition-en` | string | `descriptionOfExperimentalConditionEn` |
| `Analysis-type` | string[] | `analysisType` |
| `Analysis-type-other` | string | `analysisTypeOther` |
| `target-type-of-acquired-data` | string | `targetTypeOfAcquiredData` |
| `target-type-of-acquired-data-en` | string | `targetTypeOfAcquiredDataEn` |
| `availability-of-commercial-use` | string | `availabilityOfCommercialUse` |
| `conflict-of-interest-Yes-or-No` | string | `conflictOfInterest` |
| `necessity-of-contact-and-permission` | string | `necessityOfContactAndPermission` |
| `necessity-of-including-in-acknowledgments` | string | `necessityOfIncludingInAcknowledgments` |
| `names-to-be-included-in-the-acknowledgments` | string | `namesToBeIncludedInAcknowledgments` |
| `names-to-be-included-in-the-acknowledgments-en` | string | `namesToBeIncludedInAcknowledgmentsEn` |
| `repository-information` | string | `repositoryInformation` |
| `repository-url-doi-link` | string | `repositoryUrlDoiLink` |
| `date-registered-in-metadata` | string | `dateRegisteredInMetadata` |
| `date-updated-in-metadata` | string | `dateUpdatedInMetadata` |
| `disclaimer-version` | string | `disclaimerVersion` |
| `disclaimer-check-date` | string | `disclaimerCheckDate` |
| `grdm-files` | JSON string | `grdmFiles: GrdmRegisteredFile[]` |
| `Checklist1`–`Checklist13` | string[] | `checklists: Record<string, string[]>` |

### Ms2Person shape (from `data-creator` / `data-manager` JSON)
```json
{ "name": "...", "name-en": "...", "belonging": "...", "belonging-en": "...", "contact": "..." }
```

### Ms2Keyword shape (from `keywords` JSON)
```json
{ "filename": "...", "filename-en": "..." }
```

---

## Implementation Steps

### Step 1: Update `src/types/ms2-mibyodb-metadata.ts`
Add:
- `Ms2Person` interface
- `Ms2Keyword` interface
- `Ms2ProjectRegisteredMeta` interface with `schemaType: 'ms2-mibyodb'`

### Step 2: Update `src/types/project-metadata.ts`
- Export schema ID constants: `SCHEMA_ID_PUBLIC_FUNDING`, `SCHEMA_ID_MS2_MIBYODB`
- Export `GrdmRegistrationSchemaRelationship` interface (adds `data?` to library type)
- Add `schemaType: 'public-funding'` to `GrdmRegisteredMeta` (discriminator)
- Export `GrdmParsedMeta = GrdmRegisteredMeta | Ms2ProjectRegisteredMeta`
- Update `GrdmDraftProjectMetadataAttributes.grdmMeta` type to `GrdmParsedMeta`

### Step 3: Update `src/utils/parseGrdmMeta.ts`
- Set `schemaType: 'public-funding'` in `parseGrdmMetaRecord` return value
- Add `parseMs2ProjectMetaRecord(metaRecord)` function

### Step 4: Update `src/resources/DraftProjectMetadata.ts`
- Import `TransformedResource` from `osf-api-v2-typescript`
- Import `GrdmRegistrationSchemaRelationship`, `SCHEMA_ID_MS2_MIBYODB`, `GrdmParsedMeta`
- Import `parseMs2ProjectMetaRecord`
- Update `parseGrdmMeta` parameter type to `TransformedResource<GrdmDraftProjectMetadataAttributes>`
- Add schema dispatch logic:
  ```
  schemaId = item.relationships?.registration_schema?.data?.id
  if (schemaId === SCHEMA_ID_MS2_MIBYODB) → parseMs2ProjectMetaRecord
  else → parseGrdmMetaRecord  (schema ① or unknown)
  ```

### Step 5: Update test fixtures
- `tests/fixtures/draft-registration-response.json`: add `relationships.registration_schema.data.id = "66d7d4ec299c4f00071be84f"`
- `tests/fixtures/draft-registration-ms2-response.json` (new): minimal fixture for schema ②

### Step 6: Write/update tests
- `tests/utils/parseGrdmMeta.test.ts` (new): unit tests for both parse functions
- `tests/resources/DraftProjectMetadata.test.ts`:
  - Update existing schema ① tests to use `schemaType === 'public-funding'` type guard where required
  - Add new `describe` block for schema ② tests

---

## TDD Workflow

```
1. Write tests (RED) → tests fail
2. Implement types + functions (GREEN) → tests pass
3. Run full test suite → all pass
```

---

## Files Changed

| File | Action |
|---|---|
| `src/types/ms2-mibyodb-metadata.ts` | Add Ms2Person, Ms2Keyword, Ms2ProjectRegisteredMeta |
| `src/types/project-metadata.ts` | Add constants, GrdmRegistrationSchemaRelationship, schemaType, GrdmParsedMeta |
| `src/utils/parseGrdmMeta.ts` | Add schemaType to existing func, add parseMs2ProjectMetaRecord |
| `src/resources/DraftProjectMetadata.ts` | Schema dispatch logic |
| `tests/fixtures/draft-registration-response.json` | Add relationships |
| `tests/fixtures/draft-registration-ms2-response.json` | New fixture |
| `tests/utils/parseGrdmMeta.test.ts` | New unit test file |
| `tests/resources/DraftProjectMetadata.test.ts` | Update + add tests |
