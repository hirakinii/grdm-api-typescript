# Implementation Plan: Issue #22 - Add Support for MS2 Mibyodb Metadata Schema

## Background

GakuNin RDM currently provides two file metadata schemas:

| # | Schema ID | Name |
|---|-----------|------|
| ① | `66d7d4ec299c4f00071be84f` | 公的資金による研究データのメタデータ (Public Funding Research Data Metadata) |
| ② | `67e381081921b4000842c800` | ムーンショット目標2データベース（未病DB）のメタデータ (MS2 Mibyodb Metadata) |

`grdm-api-typescript` currently only supports schema ①. This plan adds support for schema ②,
and introduces an extensible architecture so that future schemas can be added with minimal effort.

---

## Architecture Design

### Core Principle: Union Type + Discriminated Schema Interfaces + Type Guards

Adding a new schema in the future requires only:
1. Create `src/types/<new-schema>.ts` (field type definitions)
2. Add one line to `GrdmFileMetadataData` union in `file-metadata.ts`
3. Add a schema ID constant (one line)
4. Add a narrowed interface (schema-specific `extends GrdmFileMetadataSchema`)
5. Add a type guard function

### Type Hierarchy

```
GrdmFileMetadataSchema                      ← base interface (backward compatible)
  .data: GrdmFileMetadataData               ← union type (grows as schemas are added)
           |
           ├── GrdmFileMetadataFields       (schema ①: existing)
           └── Ms2MibyoDbMetadataFields     (schema ②: new)
               └── (FutureSchemaFields)     (future schemas: TBD)

Narrowed schema interfaces (for type-safe access after narrowing):
  PublicFundingFileMetadataSchema extends GrdmFileMetadataSchema
    .data: GrdmFileMetadataFields

  Ms2MibyoDbFileMetadataSchema extends GrdmFileMetadataSchema
    .data: Ms2MibyoDbMetadataFields
```

### Key Type Change: `GrdmFileMetadataSchema.data`

`data` changes from `GrdmFileMetadataFields` to the union type `GrdmFileMetadataData`.
This means **direct property access on `data` requires type narrowing** via type guards.

Before (schema ① only):
```typescript
const meta = await client.fileMetadata.getActiveMetadata(projectId, path);
console.log(meta?.data['grdm-file:title-ja']?.value); // direct access OK
```

After (multi-schema support):
```typescript
const meta = await client.fileMetadata.getActiveMetadata(projectId, path);
if (meta && isPublicFundingSchema(meta)) {
  console.log(meta.data['grdm-file:title-ja']?.value); // narrowed to schema ①
}
if (meta && isMs2MibyoDbSchema(meta)) {
  console.log(meta.data['grdm-file:d-msr-object-of-measurement-jp']?.value); // narrowed to schema ②
}
```

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/types/ms2-mibyodb-metadata.ts` | **New** | Schema ② field type definitions (84 fields) |
| `src/types/file-metadata.ts` | **Modified** | Union type, schema ID constants, narrowed interfaces, type guards |
| `src/types/index.ts` | **Modified** | Export new `ms2-mibyodb-metadata` module |
| `tests/fixtures/ms2-mibyodb-metadata-response.json` | **New** | Full API response fixture for schema ② |
| `tests/types/ms2-mibyodb-metadata.test.ts` | **New** | Type and type guard tests for schema ② |
| `tests/types/file-metadata.test.ts` | **Modified** | Update schema ① access to use type guards |
| `tests/resources/FileMetadata.test.ts` | **Modified** | Update `getActiveMetadata` assertion to use type guard |

---

## Implementation Steps (TDD)

### Phase 1: RED — Write Failing Tests

#### Step 1: Create test fixture
- **File**: `tests/fixtures/ms2-mibyodb-metadata-response.json`
- **Action**: Create a full `GrdmFileMetadataResponse` JSON fixture containing a file with
  schema ② active metadata (all 84 fields, based on the provided example JSON)

#### Step 2: Create schema ② type tests (new file)
- **File**: `tests/types/ms2-mibyodb-metadata.test.ts`
- **Test cases**:
  | Test | Expected |
  |------|----------|
  | `Ms2MibyoDbMetadataFields` object with string values is valid | TypeScript compiles without error |
  | `Ms2MibyoDbMetadataFields` object with null values is valid | TypeScript compiles without error |
  | `isMs2MibyoDbSchema` returns `true` for schema ② ID | `true` |
  | `isMs2MibyoDbSchema` returns `false` for schema ① ID | `false` |
  | `isPublicFundingSchema` returns `true` for schema ① ID | `true` |
  | `isPublicFundingSchema` returns `false` for schema ② ID | `false` |
  | After `isMs2MibyoDbSchema` guard, specific ② field is accessible | Field value accessible |
  | After `isPublicFundingSchema` guard, specific ① field is accessible | Field value accessible |

#### Step 3: Update `tests/types/file-metadata.test.ts`
- **Action**: Update tests that directly access `schema.data['grdm-file:...']` to first
  narrow via `isPublicFundingSchema` type guard
- **Reason**: `data` is now `GrdmFileMetadataData` (union), so direct named property
  access requires narrowing

#### Step 4: Update `tests/resources/FileMetadata.test.ts`
- **Action**: Update `getActiveMetadata` assertion that accesses `metadata?.data['grdm-file:data-number']`
  to use `isPublicFundingSchema(metadata)` guard first

---

### Phase 2: GREEN — Implementation

#### Step 5: Create `src/types/ms2-mibyodb-metadata.ts` (new file)

```typescript
import { GrdmFileMetadataField } from './project-metadata';

/**
 * A metadata field specific to the MS2 Mibyodb schema.
 * All values are constrained to string | null (unlike the general GrdmFileMetadataField).
 */
export interface Ms2MibyoDbMetadataField extends GrdmFileMetadataField {
  value: string | null;
  comments: unknown[];
}

/**
 * Metadata fields for schema "67e381081921b4000842c800":
 * ムーンショット目標2データベース（未病DB）のメタデータ
 * All 84 fields with value type string | null.
 */
export interface Ms2MibyoDbMetadataFields {
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
  'grdm-file:Label-folder'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-Structure-or-descriptions-of-folders-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-remarks-jp'?: Ms2MibyoDbMetadataField;
  'grdm-file:d-fol-remarks-en'?: Ms2MibyoDbMetadataField;
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
```

#### Step 6: Update `src/types/file-metadata.ts`

Changes:
- Import `Ms2MibyoDbMetadataFields` from `./ms2-mibyodb-metadata`
- Add schema ID constants:
  ```typescript
  export const SCHEMA_ID_PUBLIC_FUNDING = '66d7d4ec299c4f00071be84f' as const;
  export const SCHEMA_ID_MS2_MIBYODB    = '67e381081921b4000842c800' as const;
  ```
- Add union type alias:
  ```typescript
  export type GrdmFileMetadataData =
    | GrdmFileMetadataFields
    | Ms2MibyoDbMetadataFields;
  ```
- Change `GrdmFileMetadataSchema.data` from `GrdmFileMetadataFields` to `GrdmFileMetadataData`
- Add narrowed schema interfaces:
  ```typescript
  export interface PublicFundingFileMetadataSchema extends GrdmFileMetadataSchema {
    schema: typeof SCHEMA_ID_PUBLIC_FUNDING;
    data: GrdmFileMetadataFields;
  }
  export interface Ms2MibyoDbFileMetadataSchema extends GrdmFileMetadataSchema {
    schema: typeof SCHEMA_ID_MS2_MIBYODB;
    data: Ms2MibyoDbMetadataFields;
  }
  ```
- Add type guard functions:
  ```typescript
  export function isPublicFundingSchema(s: GrdmFileMetadataSchema): s is PublicFundingFileMetadataSchema {
    return s.schema === SCHEMA_ID_PUBLIC_FUNDING;
  }
  export function isMs2MibyoDbSchema(s: GrdmFileMetadataSchema): s is Ms2MibyoDbFileMetadataSchema {
    return s.schema === SCHEMA_ID_MS2_MIBYODB;
  }
  ```

#### Step 7: Update `src/types/index.ts`

Add:
```typescript
export * from './ms2-mibyodb-metadata';
```

---

### Phase 3: VERIFY

#### Step 8: Run tests

```bash
npm test
```

All tests should pass with coverage ≥ 80%.

#### Step 9: Security check

Per `~/.claude/rules/security.md`:
- [ ] No hardcoded secrets
- [ ] No user input validation required (type-only changes)
- [ ] No XSS/SQL injection vectors introduced

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Existing code accessing `schema.data['grdm-file:...']` breaks TypeScript compilation | Update affected tests to use type guard narrowing; document the breaking change |
| Future schema has value types other than `string \| null` | `Ms2MibyoDbMetadataField` is schema-specific; future schemas define their own field type |
| `t-abt-text/binary` key contains `/` (unusual) | TypeScript string literal keys support any character; no special handling needed |

---

## Success Criteria

- [ ] `npm test` passes with coverage ≥ 80%
- [ ] `npm run build` completes without TypeScript errors
- [ ] `isMs2MibyoDbSchema` correctly narrows to `Ms2MibyoDbFileMetadataSchema`
- [ ] `isPublicFundingSchema` correctly narrows to `PublicFundingFileMetadataSchema`
- [ ] All 84 schema ② fields are defined in `Ms2MibyoDbMetadataFields`
- [ ] Adding a future schema requires changes to only `GrdmFileMetadataData` union + new file
