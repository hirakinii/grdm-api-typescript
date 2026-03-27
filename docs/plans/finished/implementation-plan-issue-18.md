# Implementation Plan: Issue #18 - Update Dataset Metadata and Add Manuscript Metadata

## Background

The GRDM file metadata schema has been updated. The new API response includes:
- 15 new fields (manuscript-related fields such as journal name, DOI, authors, etc.)
- All existing fields are preserved

Additionally, a pre-existing bug was identified: `GrdmCreator` uses camelCase properties
(`nameJa`, `nameEn`) while the actual API response uses snake_case (`name_ja`, `name_en`).
`ProjectMetadata.ts` compensated for this with a manual conversion, which will be removed.

---

## Impact Analysis

### `GrdmCreator` snake_case fix

| File | Change |
|------|--------|
| `src/types/project-metadata.ts` | `nameJa` → `name_ja`, `nameEn` → `name_en` |
| `src/resources/ProjectMetadata.ts` | Remove camelCase mapping in `parseGrdmFiles` |
| `tests/types/project-metadata.test.ts` | Update assertions to snake_case |
| `tests/types/file-metadata.test.ts` | Update assertions to snake_case |
| `tests/resources/ProjectMetadata.test.ts` | Update assertions to snake_case |
| `examples/fetch_project_and_file_metadata.ts` | Update property references to snake_case |

### New fields added to `GrdmFileMetadataFields`

15 new optional fields:

| Field key | Description |
|-----------|-------------|
| `grdm-file:file-type` | File type (e.g., "dataset") |
| `grdm-file:doi` | DOI |
| `grdm-file:manuscript-type` | Manuscript type |
| `grdm-file:authors` | Authors (nullable) |
| `grdm-file:journal-name-ja` | Journal name (Japanese) |
| `grdm-file:journal-name-en` | Journal name (English) |
| `grdm-file:date-published` | Publication date |
| `grdm-file:volume` | Volume |
| `grdm-file:issue` | Issue |
| `grdm-file:page-start` | Start page |
| `grdm-file:page-end` | End page |
| `grdm-file:reviewed` | Peer-reviewed flag |
| `grdm-file:version` | Version |
| `grdm-file:publication-link` | Publication URL |
| `grdm-file:dataset-link` | Dataset URL |

---

## Implementation Steps (TDD)

### Step 1: Update test fixture (RED)
- `tests/fixtures/file-metadata-response.json`
  - Add new fields to the fixture data to reflect the updated API schema

### Step 2: Update type tests (RED)
- `tests/types/project-metadata.test.ts`
  - Replace `nameJa`/`nameEn` with `name_ja`/`name_en` in `GrdmCreator` test cases
- `tests/types/file-metadata.test.ts`
  - Replace `nameJa`/`nameEn` with `name_ja`/`name_en`
  - Add test cases for representative new fields (`grdm-file:file-type`, `grdm-file:doi`, `grdm-file:manuscript-type`)
- `tests/resources/ProjectMetadata.test.ts`
  - Replace `creators[0].nameJa` / `creators[0].nameEn` with snake_case

### Step 3: Update type definitions (GREEN)
- `src/types/project-metadata.ts`
  - Rename `nameJa` → `name_ja`, `nameEn` → `name_en` in `GrdmCreator`
- `src/types/file-metadata.ts`
  - Add 15 new optional fields to `GrdmFileMetadataFields`

### Step 4: Update runtime logic (GREEN)
- `src/resources/ProjectMetadata.ts`
  - Remove camelCase conversion in `parseGrdmFiles` (API already returns snake_case)

### Step 5: Update example code
- `examples/fetch_project_and_file_metadata.ts`
  - Update `c.nameJa` / `c.nameEn` references to `c.name_ja` / `c.name_en`

### Step 6: Verify
- Run `npm test` to confirm all tests pass
- Run `npm run build` to confirm no TypeScript errors
