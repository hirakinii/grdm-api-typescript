# Implementation Plan: GrdmFiles Resource (Issue #14)

## Overview

Add a `GrdmFiles` resource class to `grdm-api-typescript` that extends the upstream
`Files` class from `osf-api-v2-typescript`. This provides subfolder navigation via
`listByPath()` and `listByPathPaginated()` under the GRDM-specific `grdmFiles` accessor
on `GrdmClient`, following the same lazy-init pattern used by `projectMetadata` and
`fileMetadata`.

## Requirements

- Expose `listByPath(nodeId, provider, folderPath, params?)` for one-shot subfolder listing
- Expose `listByPathPaginated(nodeId, provider, folderPath, params?)` for auto-pagination
- URL construction: `nodes/{nodeId}/files/{provider}/{folderPath.replace(/^\//, '')}`
- Accessible as `grdmClient.grdmFiles.listByPath(...)`
- Full test coverage (≥80%) following TDD workflow
- No breaking changes to existing public API

## Architecture Changes

- **`src/resources/GrdmFiles.ts`** (new): `GrdmFiles extends Files` — thin subclass,
  inherits `listByPath` and `listByPathPaginated` from upstream, serves as extension
  point for future GRDM-specific file behavior
- **`src/resources/index.ts`** (modify): add `export * from './GrdmFiles'`
- **`src/client.ts`** (modify): add `_grdmFiles` private field and `get grdmFiles(): GrdmFiles`
  lazy accessor
- **`tests/resources/GrdmFiles.test.ts`** (new): unit tests for `listByPath` and
  `listByPathPaginated`
- **`tests/client.test.ts`** (modify): add accessor tests for `grdmFiles`

## Implementation Steps

### Phase 1: Tests (RED)

1. **Write GrdmFiles unit tests** (File: `tests/resources/GrdmFiles.test.ts`)
   - Action: Create test file with `fetchMock`; write tests that will fail until
     `GrdmFiles` is implemented
   - Test cases:
     - `listByPath` calls correct URL (`nodes/{id}/files/{provider}/{path}/`)
     - Leading slash is stripped from `folderPath`
     - Trailing slash is preserved (OSF folder URL convention)
     - Returns `TransformedList<OsfFileAttributes>`
     - Optional `params` are forwarded as query parameters
     - `listByPathPaginated` returns a `PaginatedResult`
     - `listByPathPaginated` can iterate items via `for await`
   - Dependencies: None
   - Risk: Low

### Phase 2: Implementation (GREEN)

2. **Create GrdmFiles class** (File: `src/resources/GrdmFiles.ts`)
   - Action: Create file importing `Files` from `osf-api-v2-typescript`; define
     `export class GrdmFiles extends Files {}` — methods are fully inherited
   - Why: Provides a GRDM-namespaced class that can be extended later without
     touching upstream types; follows `ProjectMetadata`/`FileMetadata` pattern
   - Dependencies: None
   - Risk: Low

3. **Export GrdmFiles** (File: `src/resources/index.ts`)
   - Action: Append `export * from './GrdmFiles';`
   - Dependencies: Step 2
   - Risk: Low

4. **Add `grdmFiles` accessor to GrdmClient** (File: `src/client.ts`)
   - Action: Add private `_grdmFiles?: GrdmFiles` field and public getter:
     ```typescript
     get grdmFiles(): GrdmFiles {
       if (!this._grdmFiles) {
         this._grdmFiles = new GrdmFiles(this.httpClient);
       }
       return this._grdmFiles;
     }
     ```
   - Import `GrdmFiles` from `./resources/GrdmFiles`
   - Dependencies: Steps 2 & 3
   - Risk: Low — additive change only

### Phase 3: Extend Tests (VERIFY)

5. **Update client tests** (File: `tests/client.test.ts`)
   - Action: Add to `resource accessors` describe block:
     - `grdmFiles` returns a `GrdmFiles` instance
     - Same instance returned on repeated access (lazy init)
     - Integration test: `grdmFiles.listByPath` hits the correct URL
   - Dependencies: Steps 2–4
   - Risk: Low

## Testing Strategy

| Test | File | What it covers |
|---|---|---|
| Unit | `tests/resources/GrdmFiles.test.ts` | URL construction, param forwarding, return types, pagination |
| Integration | `tests/client.test.ts` | Accessor lazy-init, end-to-end URL via `GrdmClient` |

Edge cases to cover:
- `folderPath` with leading `/` (stripped)
- `folderPath` without leading `/` (unchanged)
- `folderPath` that already ends with `/` (kept as-is)
- Empty `params` object

## Risks & Mitigations

- **Risk**: `osf-api-v2-typescript` does not export `Files` constructor args type
  - Mitigation: Pass `httpClient` directly; `Files` extends `BaseResource` whose
    constructor accepts `HttpClient` — confirmed by reading `BaseResource.d.ts`
- **Risk**: Naming conflict with existing inherited `client.files` accessor
  - Mitigation: Accessor name is `grdmFiles`, clearly distinct from the inherited `files`

## Success Criteria

- [ ] `GrdmFiles` class exists in `src/resources/GrdmFiles.ts`
- [ ] `GrdmClient.grdmFiles` returns a `GrdmFiles` instance (lazy-init)
- [ ] `grdmClient.grdmFiles.listByPath(nodeId, provider, folderPath)` hits
      `nodes/{nodeId}/files/{provider}/{folderPath}/` (leading slash stripped)
- [ ] `grdmClient.grdmFiles.listByPathPaginated(...)` returns a `PaginatedResult`
- [ ] All existing tests pass
- [ ] New tests pass with ≥80% coverage
