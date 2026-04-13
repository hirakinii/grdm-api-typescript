# Implementation Plan: Issue #26 — Add File Metadata Update (PATCH) Method

<!-- All contents below should be written in English. -->

## Overview

Add a `updateFileMetadata` method to the `FileMetadata` resource class that sends a PATCH request to the GakuNin RDM v1 API to update the metadata of a specific file. The request body matches the `GrdmFileItem` interface already defined in the codebase.

## Background

The GakuNin RDM v1 API exposes a PATCH endpoint for updating file-level metadata:

```
PATCH {GRDM_API_V1_BASE_URL}/project/<projectId>/metadata/files/<storageProvider>/<fileName.ext>
```

Until now, only the GET path (`getByProject`, `findFileByPath`, `getActiveMetadata`) has been implemented. Consumers such as DMP editors need to be able to write back updated metadata to GRDM after editing.

The request body format is identical to `GrdmFileItem`, which is already typed in `src/types/file-metadata.ts`.

## Affected Files

| File | Change |
|------|--------|
| `src/resources/FileMetadata.ts` | Add `updateFileMetadata` method |
| `tests/resources/FileMetadata.test.ts` | Add unit tests for the new method |
| `tests/fixtures/file-metadata-update-request.json` | Add fixture for request body (optional, tests may use inline objects) |

## Detailed Design

### URL Construction

The v1 PATCH URL has the form:

```
{v1BaseUrl}/project/{projectId}/metadata/files/{storageProvider}/{fileName}
```

`GrdmFileItem.path` already encodes both segments (e.g., `"osfstorage/README.md"`).
Split on the first `/` to derive `storageProvider` and `fileName`:

```typescript
const [storageProvider, ...rest] = fileItem.path.split('/');
const fileName = rest.join('/');
const endpoint = `${baseUrl}/project/${projectId}/metadata/files/${storageProvider}/${fileName}`;
```

### New Method Signature

```typescript
/**
 * Update file metadata for a specific file via the v1 PATCH API.
 *
 * @param projectId - ID of the project (node)
 * @param fileItem - GrdmFileItem to update; its `path` field determines the target file
 * @returns The updated GrdmFileItem as returned by the server, or void if the API returns 204
 */
async updateFileMetadata(projectId: string, fileItem: GrdmFileItem): Promise<void>
```

> The API response format for PATCH is not yet confirmed. The method should be designed so the return type can be refined to `GrdmFileItem` or `GrdmFileMetadataResponse` once the actual response is known. For now, `Promise<void>` is a safe starting point — the caller gets an error on failure and nothing on success.

### httpClient vs. customFetch pattern

Follow the same dual-path pattern used in `getByProject`:

- If `customFetch` **and** `tokenProvider` are present → call `customFetch` directly with `method: 'PATCH'` and a JSON body.
- Otherwise → use `httpClient.patch<void>(endpoint, body)` (or equivalent).

Check that `HttpClient` from `osf-api-v2-typescript` exposes a `patch` method; if not, fall back to `customFetch` path only, or use a raw `fetch` via the existing `httpClient` request mechanism.

### Implementation Sketch

```typescript
async updateFileMetadata(projectId: string, fileItem: GrdmFileItem): Promise<void> {
  const baseUrl = this.v1BaseUrl.replace(/\/$/, '');
  const [storageProvider, ...rest] = fileItem.path.split('/');
  const fileName = rest.join('/');
  const endpoint = `${baseUrl}/project/${projectId}/metadata/files/${storageProvider}/${fileName}`;
  const body = JSON.stringify(fileItem);

  if (this.customFetch && this.tokenProvider) {
    const token = await this.tokenProvider();
    const response = await this.customFetch(endpoint, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status} ${response.statusText}`);
    }
    return;
  }

  // httpClient path — adjust based on the actual HttpClient API
  await this.httpClient.patch<void>(endpoint, body);
}
```

## Test Plan

All tests follow the TDD workflow: write tests first (RED), then implement (GREEN).

### Unit Tests — `tests/resources/FileMetadata.test.ts`

Add a new `describe('updateFileMetadata')` block covering:

1. **Correct URL construction** — Verifies the PATCH request is made to
   `{v1BaseUrl}/project/{projectId}/metadata/files/{storageProvider}/{fileName}`.
2. **Request body serialization** — Verifies the `GrdmFileItem` is sent as a JSON body.
3. **Authorization header** — Verifies `Bearer <token>` is included in both `customFetch` and `httpClient` paths.
4. **HTTP error propagation** — Verifies a non-2xx response throws an `Error` with the status code.
5. **customFetch path** — Verifies `customFetch` is called (not `httpClient`) when both are provided.
6. **httpClient fallback** — Verifies `fetchMock` is called when no `customFetch` is provided.
7. **Path with sub-directories** — Verifies paths like `osfstorage/subdir/file.csv` are handled correctly (fileName = `subdir/file.csv`).

### Integration / Smoke Test

Use the example script pattern (similar to `examples/fetch_grdm_file_metadata.ts`) to manually verify a PATCH round-trip against a real GRDM sandbox environment.

## Open Questions

~~1. **HTTP response format** — Does the PATCH endpoint return the updated `GrdmFileItem`, a full `GrdmFileMetadataResponse`, or an empty 204?~~
**Resolved:** The user confirmed responses are 200. Return type is `Promise<void>` (response body is intentionally ignored for now; can be refined later if consumers need it).

~~2. **`HttpClient.patch` availability** — Does `HttpClient` from `osf-api-v2-typescript` expose a `patch` method?~~
**Resolved:** `HttpClient.patch<T>(endpoint, body, options?)` exists and sets `Content-Type: application/json` automatically via the internal `request` method.

## Completion Checklist

- [x] Write failing unit tests for `updateFileMetadata` (TDD: RED)
- [x] Implement `updateFileMetadata` in `src/resources/FileMetadata.ts` (TDD: GREEN)
- [x] All new tests pass and no existing tests regress (126/126)
- [x] Verify URL construction for paths with sub-directories
- [x] Verify error handling for non-2xx responses
- [x] Resolve open question on HTTP response format and update return type if needed
- [x] Resolve open question on `HttpClient.patch` availability
- [x] Update `docs/specifications.md` if the PATCH endpoint details are documented there
- [x] Update `README.md` if the public API surface is described there
