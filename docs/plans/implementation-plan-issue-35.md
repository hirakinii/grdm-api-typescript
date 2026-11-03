# Implementation Plan: Issue #35 — Type Person-Name Fields of Public Funding File Metadata

<!-- All contents below should be written in English. -->

## Overview

Align the TypeScript types of the Public Funding schema (`66d7d4ec299c4f00071be84f`) file metadata with the data actually stored by GRDM. Person names in `grdm-file:data-man-name-ja/en`, `grdm-file:creators`, and `grdm-file:authors` are `{ last, middle, first }` objects with hyphenated keys, but the current types expose them as `unknown`, and the legacy `GrdmCreator` type uses a different shape. This change makes `GrdmFileMetadataField` generic, adds `GrdmPersonName` / `GrdmPerson`, deprecates `GrdmCreator`, and adds the helpers `formatPersonName` / `parsePersonName`. It is released as 0.8.0.

## Background

- DMP Editor displayed the data manager as `[object Object]`. It stringified the value with `String()`, and because `GrdmFileMetadataField.value` is `unknown`, nothing in the types showed that the value is an object.
- `GrdmCreator` (`{ number, name_ja, name_en }` with string values) was modelled on a sample taken via the API in 2026-03 (`docs/reference/grdm-file-metadata-for-dataset.json`). The sample is no longer representative.
- The file metadata of project `uzdsn` was re-fetched through the v1 API (`GET /api/v1/project/uzdsn/metadata/project`) on 2026-11-02. It contains 12 Public Funding items:

| Field | Observed shape |
|---|---|
| `grdm-file:data-man-name-ja` / `-en` | `{ last, middle, first }` (9) or `null` (3) |
| `grdm-file:creators` | `[{ number, "name-ja": PersonName, "name-en": PersonName }]` (4) or `null` (8) |
| `grdm-file:authors` | `[{ number, "name-ja": PersonName \| null, "name-en": PersonName, "affiliation-name-ja", "affiliation-name-en" }]` (3), `null` (4), or key absent (5, folder items) |
| All other fields | `string` (`""` when not set) |

- No legacy shape (underscore keys, plain-string names) was found in the live file metadata.
- Every `creators` and `data-man-name-*` entry has `first: ""` and `middle: ""`, with the full name in `last`.
- `affiliation-name-*` is always present in `authors` entries (as `""` when empty) and never present in `creators` entries.
- Folder items have only 34 fields. Manuscript-related keys (`authors`, `file-type`, `journal-*`, and so on) are absent.
- `middle` is not required by the GRDM schema (confirmed by the maintainer), but GRDM always stores it, as `""` when empty.
- GRDM's behaviour when PATCH receives an invalid shape is still unknown and is being confirmed with the GRDM team. To be safe, writers should send the canonical shape with empty strings filled in.
- The legacy shape still exists elsewhere. On 2026-11-04, the `grdm-files` snapshot of a Public Funding draft registration in `uzdsn` was found to contain `creators` as `[{ number, name_ja: string, name_en: string }]` and `data-man-name-ja` as a plain `string`. Snapshots do not seem to be refreshed when the file metadata changes. `GrdmCreator` therefore describes real data: the legacy snapshot shape. Typing `GrdmRegisteredFile.metadata` is tracked separately in #36.

## Affected Files

| File | Change |
|------|--------|
| `src/types/project-metadata.ts` | Make `GrdmFileMetadataField` generic; add `GrdmPersonName` and `GrdmPerson`; mark `GrdmCreator` as `@deprecated` |
| `src/types/file-metadata.ts` | Type every field of `GrdmFileMetadataFields` |
| `src/types/ms2-mibyodb-metadata.ts` | Express `Ms2MibyoDbMetadataField` via `GrdmFileMetadataField<string \| null>` (no shape change) |
| `src/utils/personName.ts` | New: `formatPersonName`, `parsePersonName` |
| `src/utils/index.ts` | Re-export `personName` |
| `tests/utils/personName.test.ts` | New: unit tests for the helpers |
| `tests/types/file-metadata.test.ts` | Replace `GrdmCreator` usage with `GrdmPerson`; add type-level tests |
| `tests/types/project-metadata.test.ts` | Add tests for the new types; keep one `GrdmCreator` test for the deprecated type |
| `tests/resources/FileMetadata.test.ts` | Assert person-name shapes read from the fixture |
| `tests/fixtures/file-metadata-response.json` | Rewrite person fields to the actual shape; add manuscript and folder items |
| `examples/fetch_grdm_file_metadata.ts` | Use `formatPersonName` instead of reading `name_ja` |
| `examples/update_grdm_file_metadata.ts` | Narrow with `isPublicFundingSchema` instead of casting `schema.data` to a loose record (surfaced by the new types) |
| `docs/specifications.md` | Update §5.1, §5.2 (`authors`, Creators, Data Manager) and §8.3 |
| `README.md` | Document the new types and helpers |
| `CHANGELOG.md`, `package.json` | Add a 0.8.0 entry with migration notes; bump the version |

## Detailed Design

### Phase 1: Types

> Priority: Highest. This is the root cause reported in the issue.

#### `src/types/project-metadata.ts`

```typescript
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
 * A person's name as stored in GRDM file metadata.
 * GRDM often stores the full name in `last` and leaves `first` and `middle` empty.
 */
export interface GrdmPersonName {
  last: string;
  first: string;
  /** Not required by the GRDM schema, but GRDM always stores it ("" when empty). */
  middle: string;
}

/** One entry of `grdm-file:creators` or `grdm-file:authors`. */
export interface GrdmPerson {
  number: string | null;
  'name-ja': GrdmPersonName | null;
  'name-en': GrdmPersonName | null;
  /** Present in `authors` entries ("" when empty); absent in `creators` entries. */
  'affiliation-name-ja'?: string | null;
  'affiliation-name-en'?: string | null;
}

/**
 * Legacy shape of a `grdm-file:creators` entry.
 * It is not used by the current file metadata (v1 API), but it can still appear in
 * `grdm-files` snapshots of draft registrations / registrations (see #36).
 *
 * @deprecated Do not use for current file metadata or for writing back to GRDM; use `GrdmPerson`.
 * Kept to describe legacy snapshot data, so it will not be removed.
 */
export interface GrdmCreator { /* unchanged */ }
```

- The default type argument keeps `GrdmFileMetadataField` (no argument) source-compatible. This covers `GrdmRegisteredFile.metadata` and `parseGrdmMeta.ts`.
- `GrdmRegisteredFile.metadata` stays `Record<string, GrdmFileMetadataField>` in this issue. Its snapshots mix the legacy and current shapes and are shared by both schemas, so typing them needs its own design (#36).

#### `src/types/file-metadata.ts`

Add local aliases and type every field:

```typescript
type StringField = GrdmFileMetadataField<string | null>;
type PersonNameField = GrdmFileMetadataField<GrdmPersonName | null>;
type PersonListField = GrdmFileMetadataField<GrdmPerson[] | null>;
```

- `grdm-file:data-man-name-ja` / `-en`: `PersonNameField`
- `grdm-file:creators` / `grdm-file:authors`: `PersonListField`
- Every other key: `StringField`. All observed values are strings, and `null` is kept for safety.
- All keys stay optional, because folder items omit the manuscript-related keys.

#### `src/types/ms2-mibyodb-metadata.ts`

Make `Ms2MibyoDbMetadataField` extend `GrdmFileMetadataField<string | null>` and keep `comments` required. Its shape does not change.

### Phase 2: Helpers (`src/utils/personName.ts`)

> Priority: High. Keeps name formatting consistent across consumers and gives writers a canonical shape.

```typescript
export type PersonNameLanguage = 'ja' | 'en';

/**
 * Format a GRDM person name for display. Empty parts are skipped.
 * - ja: "last middle first"
 * - en: "first middle last"
 * Returns "" for null/undefined. A string (the legacy shape still found in
 * `grdm-files` snapshots of draft registrations) is returned trimmed as-is.
 */
export function formatPersonName(
  name: GrdmPersonName | string | null | undefined,
  lang: PersonNameLanguage,
): string;

/**
 * Split a full name into a GrdmPersonName for writing back to GRDM.
 * All three keys are always set ("" when empty).
 */
export function parsePersonName(fullName: string, lang: PersonNameLanguage): GrdmPersonName;
```

Splitting rules for `parsePersonName`. Input is trimmed and split on runs of half-width or full-width whitespace (`/[\s　]+/`).

| Tokens | `ja` | `en` |
|---|---|---|
| 0 (empty) | all `""` | all `""` |
| 1 | `last` = token | `last` = token |
| 2 | `last` = t0, `first` = t1 | `first` = t0, `last` = t1 |
| ≥3 | `last` = t0, `first` = rest joined by `" "` | `first` = t0, `last` = t[n-1], `middle` = t1..t[n-2] joined by `" "` |

- The 1-token rule matches how GRDM itself stores most names (whole name in `last`).
- For ≥3 Japanese tokens, `middle` stays `""` because Japanese names rarely have one.
- Round trip: `parsePersonName(formatPersonName(n, lang), lang)` returns `n` for any name whose parts contain no whitespace.

Two helpers are explicitly not added:

- **`getPersonDisplayName(person, preferLang)`** (choosing between `name-ja` and `name-en`). The selection rule is a UI decision. A consumer can write `formatPersonName(p['name-ja'] ?? p['name-en'], ...)`, and the README shows this pattern.
- **A legacy normaliser** (`GrdmCreator` → `GrdmPerson`). No legacy data was found in the live file metadata. Whether snapshots should be normalised or typed as a union is decided in #36.

### Phase 3: Fixtures, examples and documentation

> Priority: Medium. Keeps documentation and samples consistent with the new types.

1. In `tests/fixtures/file-metadata-response.json`, replace the person fields with the observed shapes, using dummy values only. Add:
   - a dataset item: `creators` with `first: ""` / `middle: ""`, and `data-man-name-*` as objects;
   - a manuscript item: `authors` with one entry whose `name-ja` is `null` and one fully populated entry, both with `affiliation-name-*`;
   - a folder item with the 34-field key set (no `authors` or `file-type`);
   - an item with `data-man-name-*` set to `null` and `creators` set to `null`.
2. Leave `tests/fixtures/draft-registration-response.json` unchanged. Its embedded legacy `creators` matches the real snapshot shape. Fixture coverage of both shapes is handled in #36.
3. In `examples/fetch_grdm_file_metadata.ts`, print creators, authors and the data manager via `formatPersonName`. Remove the `name_ja` cast.
4. In `docs/specifications.md`:
   - §5.1: `value` type depends on the field.
   - §5.2: fix `authors` (currently documented as `string`); replace the `GrdmCreator` table with `GrdmPerson` / `GrdmPersonName`; change the data-manager name types.
   - §8.3: fix the example output.
5. In `README.md`, add the types and helpers to the file-metadata section. Note that `String()` and template literals accept any type, so consumers should enable `@typescript-eslint/no-base-to-string` / `restrict-template-expressions`.
6. `CHANGELOG.md` 0.8.0 entry:
   - **Added**: `GrdmPersonName`, `GrdmPerson`, `formatPersonName`, `parsePersonName`.
   - **Changed (breaking)**: `GrdmFileMetadataFields` values are typed. Code that assigns values of other types, or asserts `as GrdmCreator[]`, must migrate.
   - **Deprecated**: `GrdmCreator`, for current file metadata. It is kept, because it describes legacy snapshot data.
   - A migration snippet.
7. Bump `package.json` to 0.8.0.

## Test Plan

TDD: write each test first (RED), confirm it fails, implement (GREEN), then refactor.

### Unit tests: `tests/utils/personName.test.ts`

- `formatPersonName`:
  - ja and en ordering;
  - empty `first` / `middle` skipped, so no double or trailing spaces;
  - all parts empty → `""`;
  - `null` / `undefined` → `""`;
  - string input returned trimmed.
- `parsePersonName`: every row of the splitting table for both languages; full-width space; leading, trailing and repeated whitespace; all keys always present.
- Round trip for representative names in both languages.

### Type tests (compile-time, enforced by ts-jest diagnostics; `npm run type-check` covers only `src/`)

- `tests/types/file-metadata.test.ts`:
  - `GrdmFileMetadataFields` accepts the observed shapes, including `name-ja: null` and missing `affiliation-*`.
  - Wrong shapes are rejected (`@ts-expect-error`): `name_ja` keys, a string for `data-man-name-ja`, and a number for a string field.
  - `const s: string = fields['grdm-file:data-man-name-ja']!.value` must fail to compile.
- `tests/types/project-metadata.test.ts`: `GrdmPerson` and `GrdmPersonName` literals; `GrdmFileMetadataField` without a type argument still accepts `unknown`.

### Resource tests

- `tests/resources/FileMetadata.test.ts`: `getActiveMetadata` on the new fixture items returns person names as objects; folder items have no `authors`.
- `tests/resources/ProjectMetadata.test.ts` and `DraftProjectMetadata.test.ts`: no behavioural change, because registered metadata stays `unknown` (#36). Existing assertions that read `name_ja` via `as GrdmCreator[]` stay valid, since they describe the legacy snapshot shape.

### Coverage and gates

- `npm test` passes and coverage of `src/utils/personName.ts` is 100%. Overall coverage stays ≥ 80%.
- `npm run lint`, `npm run type-check` and `npm run build` pass.

### Manual / smoke test

1. Run `GRDM_TOKEN=... GRDM_NODE_ID=uzdsn npx ts-node examples/fetch_grdm_file_metadata.ts`. Confirm that the creators, authors and data manager of `p6rtn` (dataset) and `j75hg` (manuscript) are printed as readable names, not `[object Object]`.
2. Round trip with `examples/update_grdm_file_metadata.ts` on a dataset file:
   - read `data-man-name-ja`, write back `parsePersonName(formatPersonName(v, 'ja'), 'ja')`;
   - re-fetch and confirm the value is unchanged;
   - confirm it still displays in the GRDM UI.

## Open Questions

1. **GRDM behaviour on PATCH with a non-canonical shape** (for example a plain string for `data-man-name-ja`). The maintainer is confirming this with the GRDM team. It does not block this plan, because writers send the canonical shape. If GRDM silently stores invalid shapes, consider adding runtime validation in `updateFileMetadata` in a follow-up issue.
2. **Typing of `GrdmRegisteredFile.metadata`.** Out of scope; tracked in #36.
3. **Person names in the MS2 Mibyodb schema.** These were not investigated. File-level MS2 fields are all strings, and the project-level `Ms2Person` is a separate structure. Out of scope.

## Completion Checklist

### Phase 1: Types

- [x] Write failing type tests for `GrdmPersonName`, `GrdmPerson` and typed `GrdmFileMetadataFields` (RED)
- [x] Make `GrdmFileMetadataField` generic; add `GrdmPersonName` and `GrdmPerson`; deprecate `GrdmCreator` (GREEN)
- [x] Type all keys of `GrdmFileMetadataFields`; refactor `Ms2MibyoDbMetadataField`
- [x] Update existing tests that rely on `GrdmCreator` / `name_ja`

### Phase 2: Helpers

- [x] Write failing tests for `formatPersonName` / `parsePersonName` (RED)
- [x] Implement `src/utils/personName.ts` and re-export it (GREEN)

### Phase 3: Fixtures, examples and documentation

- [x] Rewrite the fixtures with dummy values in the observed shapes
- [x] Update `examples/fetch_grdm_file_metadata.ts`
- [x] Manual smoke test 1: `examples/fetch_grdm_file_metadata.ts` against `uzdsn` prints readable names (no `[object Object]`)
- [ ] Manual smoke test 2: PATCH round trip of `data-man-name-ja` on a dataset file (writes to production GRDM; run by the maintainer)
- [x] All tests, lint, type-check and build pass; coverage ≥ 80%
- [x] Security check (`~/.claude/rules/security.md`): no real names, emails or tokens in fixtures or docs
- [x] Update a part of documents below if they are relevant to the changes in this plan:
    - [x] `docs/specifications.md`
    - [x] `README.md` in the root and `examples/README.md`
    - [x] `CHANGELOG.md` (0.8.0) and the `package.json` version
