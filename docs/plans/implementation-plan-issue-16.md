# Fix Plan: GrdmFileMetadataSchema Type Definition Mismatch

## Background

This issue was discovered while debugging `GrdmCompareModal` in `dmp-editor`.
The modal opened successfully but showed only the table header with no data rows.

## Bug Description

### Symptom

`GrdmCompareModal` displays only the table header. No comparison rows appear,
even when the target `GrdmFileItem` is correctly fetched from the GRDM v1 API.

### Root Cause

The `GrdmFileMetadataSchema` type definition declares metadata fields (e.g.,
`grdm-file:title-ja`) as **direct properties** of the schema object:

```ts
// Current (incorrect) type definition
export interface GrdmFileMetadataSchema extends Record<string, unknown> {
    schema: string;
    active: boolean;
    'grdm-file:title-ja'?: GrdmFileMetadataField;
    'grdm-file:date-issued-updated'?: GrdmFileMetadataField;
    // ...
}
```

However, the actual GRDM v1 API response nests all metadata fields under a
**`data`** key:

```json
{
  "active": true,
  "schema": "66d7d4ec299c4f00071be84f",
  "data": {
    "grdm-file:title-ja": { "value": "calculate_momentum_transfer.ipynb", "extra": [], "comments": [] },
    "grdm-file:date-issued-updated": { "value": "2025-09-11", "extra": [], "comments": [] },
    "grdm-file:data-man-email": { "value": "hiraki@nii.ac.jp", "extra": [], "comments": [] }
  }
}
```

Because `activeSchema['grdm-file:title-ja']` is `undefined` (the field lives at
`activeSchema.data['grdm-file:title-ja']`), `getGrdmFieldValue` always returned
`null`, causing all rows to be filtered out.

## Fix Plan

### 1. Correct `GrdmFileMetadataSchema`

Move the metadata fields into a nested `data` property to match the actual API
response structure:

```ts
export interface GrdmFileMetadataSchema {
    schema: string;
    active: boolean;
    data: GrdmFileMetadataFields;
}

export interface GrdmFileMetadataFields {
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
```

### 2. Update `FileMetadata.getActiveMetadata` return type

The return type should reflect the corrected structure:

```ts
// Before
getActiveMetadata(projectId: string, path: string): Promise<GrdmFileMetadataSchema | undefined>

// After (or keep as-is if callers use .data directly)
getActiveMetadata(projectId: string, path: string): Promise<GrdmFileMetadataFields | undefined>
```

Alternatively, keep the return type as `GrdmFileMetadataSchema` and let callers
access `.data` themselves.

### 3. Update callers in dmp-editor (already patched as a workaround)

`dmp-editor/src/components/EditProject/DataInfoSection.tsx` — `getGrdmFieldValue`
has been patched with a runtime cast to access `.data`:

```ts
const schemaData = (activeSchema as Record<string, unknown>)["data"] as Record<string, { value?: unknown }> | undefined
const field = schemaData?.[grdmKey as string]
```

Once the type definition in `grdm-api-typescript` is corrected, this workaround
should be replaced with the properly typed version:

```ts
const field = activeSchema.data?.[grdmKey]
```

### 4. Add a regression test

Add a test to `FileMetadata` that asserts fields are read from `.data`:

```ts
it("reads metadata fields from the data property", () => {
    const schema: GrdmFileMetadataSchema = {
        schema: "some-schema-id",
        active: true,
        data: {
            "grdm-file:title-ja": { value: "Test Title", extra: [], comments: [] },
        },
    }
    expect(schema.data["grdm-file:title-ja"]?.value).toBe("Test Title")
})
```

## Impact

This is a **breaking change** to `GrdmFileMetadataSchema`. Any consumer that
accesses metadata fields directly on the schema object (e.g.,
`schema['grdm-file:title-ja']`) must be updated to use `schema.data['grdm-file:title-ja']`.

Known consumers:
- `dmp-editor` — `DataInfoSection.tsx` `getGrdmFieldValue` (workaround already applied)
- `dmp-editor` — `useFileMetadata.ts` `extractFileSize` (accesses `activeSchema["grdm-file:file-size"]` directly — **also needs updating**)
