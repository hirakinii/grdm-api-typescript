# Implementation Plan: Issue #36 — Type the File Metadata Snapshot in `GrdmRegisteredFile.metadata`

<!-- All contents below should be written in English. -->

## Overview

Type the `grdm-files` snapshots returned in `grdmMeta.grdmFiles` of draft registrations and registrations. The snapshots mix the legacy and current person-name shapes. This plan follows **option C**:

- `parseGrdmFiles` keeps returning the data unchanged.
- The types become schema-aware, with unions of both shapes for the person-name fields.
- A new opt-in helper, `normalizeRegisteredFile`, converts legacy entries to the current shape, so consumers can work with the `GrdmFileMetadataFields` types from #35.

This is a type-level breaking change only, with no runtime behaviour change. It is released as 0.9.0.

## Background

- `GrdmRegisteredFile.metadata` is `Record<string, GrdmFileMetadataField>` (values `unknown`). `parseGrdmFiles` (`src/utils/parseGrdmMeta.ts`) casts the parsed JSON without validating it. It also drops every file key except `path`, `urlpath` and `metadata`.
- #35 typed the live file metadata (v1 API) and kept `GrdmCreator` as the legacy snapshot shape. The snapshot typing was deferred to this issue.
- Survey on 2026-11-04 (all 151 projects of the maintainer's account, via the v2 API). Only shapes were recorded, not values:

| Source | Public Funding person fields | Notes |
|---|---|---|
| Registrations (5 registrations, 12 files) | **All legacy**: `creators` = `[{ number, name_ja: string, name_en: string }]` or `null`; `data-man-name-ja/en` = `string` (10) or `""` (2) | Frozen; the legacy shape stays forever |
| Draft registrations (8 files) | Mostly current (`GrdmPerson[]`, `GrdmPersonName`); 1 file has `data-man-name-ja/en` as a legacy `string` | Mixed |

- **When a draft snapshot is rebuilt (experiment, 2026-11-04):** a v1 `PATCH` of a file's metadata immediately rebuilds the `grdm-files` snapshot of every draft registration that contains the file. The draft's `datetime_updated` also changes. This was verified on the `uzdsn` draft `69c2a927…`: a temporary marker value written to `data-description-ja` appeared in the snapshot within the same second, and restoring the file metadata restored the snapshot. This explains why that draft switched from the legacy to the current shape after the #35 smoke tests PATCHed `osfstorage/README.md`.
  - Consequence: a draft snapshot keeps whatever shape the file metadata had at the file's last PATCH. Example: in a shared project, a draft (last updated 2026-07-29) still holds the legacy shape, while the live file metadata is current. The live data was apparently migrated without a PATCH.
  - Snapshots in registrations (submitted) are frozen and were all legacy.
- Every metadata wrapper had the keys `{ value, extra, comments }`. Non-person values in Public Funding snapshots were all strings.
- File entries sometimes carry a `folder` key (`{ path, urlpath, folder, metadata }`), which `GrdmRegisteredFile` does not declare.
- Field counts are 49 (current dataset/manuscript items) or 34 (folder items and registration snapshots). All keys must stay optional.
- MS2 Mibyodb snapshots (90 fields) have the same shapes as the live MS2 file metadata. Some MS2 fields are arrays of objects, which contradicts `Ms2MibyoDbMetadataField` (`string | null`). This is tracked separately in #40. This plan reuses `Ms2MibyoDbMetadataFields`, so the #40 fix flows into the snapshots automatically.
- A legacy shape of `grdm-file:authors` was never observed. Manuscript keys do not exist in the 34-field legacy snapshots. It is typed as a union anyway, for safety.

### Why option C

| | A: normalize in `parseGrdmFiles` | B: union types only | **C: union types + opt-in normalizer** |
|---|---|---|---|
| Runtime behaviour | Changes silently (`name_ja` becomes `undefined`) | Unchanged | Unchanged |
| Fidelity to GRDM data | Lost (legacy origin invisible) | Kept | Kept |
| Consumer effort | One shape | Must narrow every time | One call to the normalizer, or narrow |
| Types | Reuse `GrdmFileMetadataFields` | New snapshot type | New snapshot type + reuse via the normalizer |

## Affected Files

| File | Change |
|------|--------|
| `src/types/project-metadata.ts` | Make `GrdmRegisteredFile` generic; add `folder?`; add `GrdmRegisteredFileMetadataFields`; type `GrdmRegisteredMeta.grdmFiles`; update the `GrdmCreator` JSDoc |
| `src/types/ms2-mibyodb-metadata.ts` | Type `Ms2ProjectRegisteredMeta.grdmFiles` as `GrdmRegisteredFile<Ms2MibyoDbMetadataFields>[]` |
| `src/utils/parseGrdmMeta.ts` | Make `parseGrdmFiles` generic over the field type; pass `folder` through when present |
| `src/utils/normalizeRegisteredFile.ts` | New: `isLegacyCreator`, `normalizePersonName`, `normalizePerson`, `normalizeRegisteredFile` |
| `src/utils/index.ts` | Re-export the new module |
| `tests/utils/normalizeRegisteredFile.test.ts` | New: unit tests for the helpers |
| `tests/utils/parseGrdmMeta.test.ts` | Add tests for `folder` passthrough and for the unchanged data (both shapes) |
| `tests/types/project-metadata.test.ts` | Type tests for the snapshot types; update the existing tests for optional keys |
| `tests/resources/DraftProjectMetadata.test.ts`, `tests/resources/ProjectMetadata.test.ts` | Remove `as GrdmCreator[]` casts that are no longer needed; add a test for a current-shape snapshot |
| `docs/specifications.md` | §6.4: snapshot typing and the normalizer; person-name types note |
| `README.md` | `grdmMeta.grdmFiles` typing and a normalizer example |
| `CHANGELOG.md`, `package.json` | 0.9.0 entry with migration notes; bump the version |

## Detailed Design

### Phase 1: Types

> Priority: Highest. This is the core of the issue.

#### `src/types/project-metadata.ts`

```typescript
/**
 * A file entry within the `grdm-files` snapshot of a draft registration / registration.
 * `TFields` is the schema-specific metadata type; the default keeps the untyped record
 * for unknown schemas.
 */
export interface GrdmRegisteredFile<TFields = Record<string, GrdmFileMetadataField>> {
  path: string;
  urlpath: string;
  /** Present in some snapshots. */
  folder?: boolean;
  metadata: TFields;
}

/** Person-name keys whose snapshot values may still use the legacy shape. */
type LegacyPersonKeys =
  | 'grdm-file:data-man-name-ja'
  | 'grdm-file:data-man-name-en'
  | 'grdm-file:creators'
  | 'grdm-file:authors';

/**
 * Metadata fields of a Public Funding (schema ①) file in a `grdm-files` snapshot.
 * Same as `GrdmFileMetadataFields`, except that the person-name fields may hold the
 * legacy shape. Snapshots in registrations are frozen and use the legacy shape;
 * snapshots in draft registrations are usually current but may be legacy.
 * Use `normalizeRegisteredFile` to convert to `GrdmFileMetadataFields`.
 */
export interface GrdmRegisteredFileMetadataFields extends Omit<GrdmFileMetadataFields, LegacyPersonKeys> {
  'grdm-file:data-man-name-ja'?: GrdmFileMetadataField<GrdmPersonName | string | null>;
  'grdm-file:data-man-name-en'?: GrdmFileMetadataField<GrdmPersonName | string | null>;
  'grdm-file:creators'?: GrdmFileMetadataField<Array<GrdmPerson | GrdmCreator> | null>;
  'grdm-file:authors'?: GrdmFileMetadataField<Array<GrdmPerson | GrdmCreator> | null>;
}
```

- `GrdmRegisteredMeta.grdmFiles?: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields>[]`
- `Ms2ProjectRegisteredMeta.grdmFiles?: GrdmRegisteredFile<Ms2MibyoDbMetadataFields>[]`. MS2 has no person-name fields at the file level. Its array fields are #40.
- `GrdmFileMetadataFields` lives in `file-metadata.ts`, which already imports from `project-metadata.ts`. To avoid a circular import, define `GrdmRegisteredFileMetadataFields` in `file-metadata.ts`, next to `GrdmFileMetadataFields`. Use `import type` in `project-metadata.ts` for the `grdmFiles` property. Type-only imports are erased, so there is no runtime cycle.
- `GrdmCreator` JSDoc: point to `normalizePerson` / `normalizeRegisteredFile` instead of saying it is untyped. It stays `@deprecated` for current file metadata.
- The typed field interfaces have no index signature, so dynamic access such as `metadata[key]` with a `string` key no longer compiles. Known keys also become optional, so `metadata['grdm-file:title-ja'].value` needs `?.`. Both are documented breaking changes. Consumers can cast to `Record<string, GrdmFileMetadataField>` for dynamic access.

#### `src/utils/parseGrdmMeta.ts`

```typescript
export function parseGrdmFiles<TFields = Record<string, GrdmFileMetadataField>>(
  files: Record<string, unknown>[],
): GrdmRegisteredFile<TFields>[];
```

- Call sites pass the schema's field type: `GrdmRegisteredFileMetadataFields` for schema ① and `Ms2MibyoDbMetadataFields` for schema ②.
- Pass `folder` through only when it is a boolean, so entries without it keep their current shape.
- No validation and no conversion. The function documents that values are cast and may contain unknown shapes.

### Phase 2: Opt-in normalizer (`src/utils/normalizeRegisteredFile.ts`)

> Priority: High. Gives consumers one shape without changing the default behaviour.

```typescript
/** Type guard for the legacy creators entry (`name_ja` / `name_en`). */
export function isLegacyCreator(person: GrdmPerson | GrdmCreator): person is GrdmCreator;

/**
 * Convert a legacy or current person name to the current shape.
 * - GrdmPersonName → returned as a copy
 * - non-empty string → { last: trimmed string, first: '', middle: '' } (no splitting; same as
 *   how GRDM stores whole names, see #35)
 * - '' / whitespace / null / undefined → null (current semantics for an unset person)
 */
export function normalizePersonName(name: GrdmPersonName | string | null | undefined): GrdmPersonName | null;

/** Convert a legacy creators / authors entry to GrdmPerson; current entries are copied. */
export function normalizePerson(person: GrdmPerson | GrdmCreator): GrdmPerson;

/**
 * Return a copy of a Public Funding snapshot file whose person-name fields use the
 * current shape, typed as GrdmFileMetadataFields. Other fields are copied unchanged.
 * The input is not mutated.
 */
export function normalizeRegisteredFile(
  file: GrdmRegisteredFile<GrdmRegisteredFileMetadataFields>,
): GrdmRegisteredFile<GrdmFileMetadataFields>;
```

Conversion rules:

| Input | Output |
|---|---|
| `data-man-name-*` = `GrdmPersonName` | same (copy) |
| `data-man-name-*` = `"山田太郎"` | `{ last: '山田太郎', middle: '', first: '' }` |
| `data-man-name-*` = `""` / `null` | `null` |
| `creators[i]` = `{ number, name_ja, name_en }` | `{ number, 'name-ja': normalizePersonName(name_ja), 'name-en': normalizePersonName(name_en) }` |
| `creators[i]` = `GrdmPerson` | same (copy) |
| `creators` / `authors` = `null` | `null` |
| field absent | absent (no key added) |

- The `extra` and `comments` of each wrapper are preserved.
- `isLegacyCreator` checks `'name_ja' in p || 'name_en' in p`, and the absence of `'name-ja'` / `'name-en'`.
- Strings are not split, consistent with the #35 decision that whole names in `last` are GRDM's storage behaviour.

### Phase 3: Documentation and release

> Priority: Medium.

1. `docs/specifications.md`:
   - §6.4: explain that snapshots are typed per schema, that legacy and current shapes are mixed (registrations are frozen legacy), and how to use `normalizeRegisteredFile`.
   - Update the `GrdmCreator` note under "Person-name types".
2. `README.md`: in the `grdmMeta` sections, show the snapshot types and an example with `normalizeRegisteredFile` + `formatPersonName`.
3. `CHANGELOG.md` 0.9.0:
   - **Added**: `GrdmRegisteredFileMetadataFields`, the helpers, `GrdmRegisteredFile.folder`.
   - **Changed (breaking, types only)**: `grdmFiles[].metadata` is typed, keys are optional, and dynamic string keys need a cast.
   - A migration snippet.
4. Bump `package.json` to 0.9.0.

## Test Plan

TDD: write each test first (RED), confirm it fails, implement (GREEN), then refactor.

### Type tests (compile-time, ts-jest diagnostics)

- `GrdmRegisteredFileMetadataFields` accepts:
  - the legacy creators;
  - a legacy string for `data-man-name-*`;
  - the current shapes;
  - the 34-field key set (no manuscript keys).
- It rejects (`@ts-expect-error`) a number for a string field.
- Reading `creators[0]['name-ja']` without narrowing is a compile error. After `!isLegacyCreator(p)`, it compiles.
- `GrdmRegisteredMeta.grdmFiles[0].metadata` is `GrdmRegisteredFileMetadataFields`. `Ms2ProjectRegisteredMeta.grdmFiles[0].metadata` is `Ms2MibyoDbMetadataFields`.
- `GrdmRegisteredFile` without a type argument still accepts arbitrary keys.

### Unit tests: `tests/utils/normalizeRegisteredFile.test.ts`

- `isLegacyCreator`: legacy, current, and an entry with both `name_ja: null` and no hyphenated keys.
- `normalizePersonName`: object copy (not the same reference), non-empty string, whitespace-padded string, `""`, whitespace only, `null`, `undefined`.
- `normalizePerson`: legacy with strings, legacy with `null` names, legacy `number: null`, and a current entry, including `affiliation-*` preservation.
- `normalizeRegisteredFile`:
  - converts every row of the conversion table;
  - preserves `extra` / `comments`, other fields, `path` / `urlpath` / `folder`;
  - does not add absent keys;
  - does not mutate the input (deep-frozen input);
  - leaves an already-current file deep-equal to the input.

### Parser tests: `tests/utils/parseGrdmMeta.test.ts`

- `folder` is passed through when it is a boolean and omitted otherwise.
- Legacy and current snapshots are returned unchanged (deep-equal to the parsed JSON).

### Resource tests

- `DraftProjectMetadata` with the existing legacy fixture: assertions compile without the `as GrdmCreator[]` cast by narrowing with `isLegacyCreator`. Add a current-shape snapshot case.
- `ProjectMetadata` (registrations): the existing tests keep passing. The test for a non-array `creators` value (`'creator-string'`) remains valid at runtime, because the data is unchanged.

### Coverage and gates

- 100% coverage of `normalizeRegisteredFile.ts`. Overall coverage stays ≥ 80%.
- `npm run lint`, `npm run type-check`, `npm run build`, and type-checking of the examples pass.

### Manual / smoke test (read-only)

- Run `client.draftProjectMetadata.listByNode` and `client.projectMetadata.listByNode` on projects with legacy registrations and current drafts, using a scratch script.
- Confirm that `normalizeRegisteredFile` + `formatPersonName` prints readable names for both shapes, and never `[object Object]`. Count lines only, without printing values.

## Open Questions

All resolved.


- ~~When does GRDM rebuild a draft's snapshot?~~ **Resolved:** on every v1 PATCH of a contained file's metadata (see Background). The types cover both shapes either way.
- ~~Legacy shape of `grdm-file:authors`.~~ **Resolved (maintainer, 2026-11-04):** it may exist even though it was never observed. It is typed as a union, and the normalizer handles a legacy entry the same way as for `creators`.
- ~~MS2 array fields.~~ **Resolved:** handled in #40. Snapshots reuse `Ms2MibyoDbMetadataFields` and will pick up the fix.

## Completion Checklist

### Phase 1: Types

- [x] Write failing type tests for the snapshot types and the generic `GrdmRegisteredFile` (RED)
- [x] Make `GrdmRegisteredFile` generic; add `folder?`; add `GrdmRegisteredFileMetadataFields`; type both `grdmFiles` properties (GREEN)
- [x] Make `parseGrdmFiles` generic and pass `folder` through; update call sites
- [x] Update the existing tests affected by optional keys / removed casts

### Phase 2: Normalizer

- [x] Write failing tests for `isLegacyCreator`, `normalizePersonName`, `normalizePerson`, `normalizeRegisteredFile` (RED)
- [x] Implement `src/utils/normalizeRegisteredFile.ts` and re-export it (GREEN)

### Phase 3: Documentation and release

- [x] Read-only smoke test on real drafts / registrations (shape counts only), 2026-11-04: 8 draft files and 12 registration files. All 12 registration files had legacy `data-man-name-*`, and 7 had legacy `creators`; one draft file had a legacy `data-man-name-*`. `normalizeRegisteredFile` + `formatPersonName` produced readable names for both shapes.
  - Finding (data, not library): in one shared demo project (read-only access), 6 live files and their draft snapshot store the literal string `"[object Object]"` in `data-man-name-ja/en.last`. This is apparently written back by the DMP Editor bug that motivated #35. It was reported to the maintainer and was not modified.
- [x] All tests, lint, type-check, build and examples type-check pass; coverage ≥ 80%
- [x] Security check (`~/.claude/rules/security.md`): no real names, numbers or tokens in fixtures, tests or docs
- [x] Update a part of documents below if they are relevant to the changes in this plan:
    - [x] `docs/specifications.md`
    - [x] `README.md`
    - [x] `CHANGELOG.md` (0.9.0) and the `package.json` version
