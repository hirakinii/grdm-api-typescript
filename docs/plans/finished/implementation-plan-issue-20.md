# Implementation Plan: Custom Fetch Injection for CORS Proxy Support (Issue #20)

## Background

When using `GrdmClient` from a browser frontend, a CORS error occurs on v1 API requests
to `rdm.nii.ac.jp/api/v1`. The root cause is server-side CORS settings, but the package
can be improved to allow users to work around it via a proxy by injecting a custom `fetch`.

## Problems

| # | Problem | Location |
|---|---------|----------|
| 1 | `v1BaseUrl` must be an absolute URL | `src/client.ts:40` — `new URL(v1BaseUrl).hostname` throws on relative paths |
| 2 | No custom fetch injection point | `HttpClient` (upstream) uses global `fetch` directly |

## Proposed Solution

Add a `fetch?: typeof fetch` option to `GrdmClientConfig`. When provided:
- `v1BaseUrl` may be a relative path (e.g. `/grdm-v1-api`)
- `FileMetadata` uses the custom fetch instead of `httpClient` for v1 API calls
- Auth headers (`Authorization: Bearer <token>`) are added before calling custom fetch

This follows a common pattern used by ky, axios, ofetch, etc.

## Usage Example (after fix)

```ts
const grdmProxyFetch: typeof fetch = (url, init) =>
  fetch((url as string).replace('https://rdm.nii.ac.jp/api/v1', '/grdm-v1-api'), init);

const client = new GrdmClient({
  token,
  baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
  v1BaseUrl: '/grdm-v1-api',  // relative path now supported
  fetch: grdmProxyFetch,
});

const meta = await client.fileMetadata.getByProject('abc12');
```

## Files to Change

### `src/types/config.ts`
- Add `fetch?: typeof fetch` to `GrdmClientConfig`

### `src/client.ts`
- Fix: only call `new URL(v1BaseUrl).hostname` when `v1BaseUrl` starts with `http`
- Add: store `customFetch` (`config.fetch`) as private field
- Add: store `v1TokenProvider` derived from `config.token` / `config.tokenProvider` / `config.oauth2Client`
- Change: pass `customFetch` and `v1TokenProvider` to `FileMetadata` constructor

### `src/resources/FileMetadata.ts`
- Add: optional `customFetch` and `tokenProvider` constructor parameters
- Change: `getByProject()` uses custom fetch path when both `customFetch` and `tokenProvider` are set

## Test Plan (TDD — write tests first)

### `tests/client.test.ts`

| Test case | Expected |
|-----------|----------|
| `fetch` option accepted in `GrdmClientConfig` type | TypeScript compiles without error |
| Relative `v1BaseUrl` with custom fetch — constructor does not throw | `client.v1BaseUrl === '/grdm-v1-api'` |
| Custom fetch is called for v1 API (`getByProject`) | Custom fetch spy invoked once |
| Custom fetch receives correct URL | URL contains `/grdm-v1-api/project/...` |
| Without custom fetch, global fetch (fetchMock) is called as before | fetchMock invoked once |

### `tests/resources/FileMetadata.test.ts`

| Test case | Expected |
|-----------|----------|
| Custom fetch invoked with `Authorization: Bearer <token>` header | Header assertion passes |
| Custom fetch result parsed and returned as `GrdmFileMetadataResponse` | `result.data.id` matches fixture |
| Without custom fetch, `httpClient` is used (existing behaviour) | No regression |

## Implementation Steps

1. **RED** — Write failing tests for new behaviour
2. **GREEN** — Implement changes in `config.ts`, `client.ts`, `FileMetadata.ts`
3. **REFACTOR** — Clean up, verify coverage ≥ 80%
4. Security check per `~/.claude/rules/security.md`

## Security Considerations

- Custom fetch is caller-supplied; no validation needed (same trust level as built-in fetch)
- Auth token is injected by the library, not exposed to custom fetch's URL-rewrite logic
- No new environment variables or secrets introduced
