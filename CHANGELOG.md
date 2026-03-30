# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-03-30

### Added

- **`DraftProjectMetadata` resource** (`client.draftProjectMetadata`): fetches and parses GRDM project metadata from OSF draft registrations (v2 API).
  - `listByNode(nodeId, params?)` — list draft registrations for a node with parsed GRDM metadata
  - `getById(draftId)` — fetch a single draft registration with parsed GRDM metadata
  - Automatically detects the registration schema from `relationships.registration_schema.data.id` and dispatches to the appropriate parser
- **MS2 Mibyodb project-level metadata support** for `DraftProjectMetadata` (schema ②, ID: `67e381081921b4000842c800`):
  - `Ms2Person` interface: data creator / manager person entry (`name`, `nameEn`, `belonging`, `belongingEn`, `contact`)
  - `Ms2Keyword` interface: keyword entry (`filename`, `filenameEn`)
  - `Ms2ProjectRegisteredMeta` interface: parsed project-level metadata for schema ②, with `schemaType: 'ms2-mibyodb'` discriminator. Fields include `projectName`, `titleOfDataset`, `dataCreators`, `dataManagers`, `keywords`, `accessRights`, `analysisType`, `checklists`, `grdmFiles`, and more.
- **`GrdmParsedMeta` union type**: `GrdmRegisteredMeta | Ms2ProjectRegisteredMeta`. Used as the type of `grdmMeta` on `GrdmDraftProjectMetadataAttributes`. Use `schemaType` to narrow: `'public-funding'` or `'ms2-mibyodb'`.
- **`GrdmRegistrationSchemaRelationship` interface**: GRDM extension of the base library's `registration_schema` relationship type, adding `data?: { id: string; type: string }`.
- **`parseMs2ProjectMetaRecord`** utility function: parses `registration_metadata` for schema ② into `Ms2ProjectRegisteredMeta`.
- **`src/types/schema-ids.ts`**: centralized definition of `SCHEMA_ID_PUBLIC_FUNDING` and `SCHEMA_ID_MS2_MIBYODB` constants. Both values are re-exported from `file-metadata.ts` for backward compatibility.
- **Example** (`examples/fetch_grdm_project_metadata.ts`): demonstrates fetching and displaying project metadata for both schema ① and schema ②, using `schemaType` to dispatch display logic.

### Changed

- **Breaking**: `GrdmRegisteredMeta` now requires `schemaType: 'public-funding'`. Existing code constructing `GrdmRegisteredMeta` literals must add this field.
- **Breaking**: `GrdmDraftProjectMetadataAttributes.grdmMeta` type changed from `GrdmRegisteredMeta` to `GrdmParsedMeta` (union). Code accessing schema ①-specific fields (e.g. `grdmMeta.funder`) must narrow the type first: `if (meta.schemaType === 'public-funding') { ... }`.
- `GrdmProjectMetadataAttributes.grdmMeta` type is unchanged (still `GrdmRegisteredMeta`); schema ② is not supported for registrations.

## [0.5.0] - 2026-03-30

### Added

- **MS2 Mibyodb metadata schema support** (schema ②, ID: `67e381081921b4000842c800`):
  - `Ms2MibyoDbMetadataField` interface: field type with `value: string | null`, a narrower variant of `GrdmFileMetadataField`
  - `Ms2MibyoDbMetadataFields` interface: 84 optional fields covering measurement, folder, text file, Excel file, image file, and arbitrary file metadata sections
  - `Ms2MibyoDbFileMetadataSchema` interface: narrowed schema interface; use after `isMs2MibyoDbSchema` guard
- Schema ID constants:
  - `SCHEMA_ID_PUBLIC_FUNDING` = `'66d7d4ec299c4f00071be84f'`
  - `SCHEMA_ID_MS2_MIBYODB` = `'67e381081921b4000842c800'`
- Type guard functions for schema-safe field access:
  - `isPublicFundingSchema(s)` — narrows `GrdmFileMetadataSchema` to `PublicFundingFileMetadataSchema`
  - `isMs2MibyoDbSchema(s)` — narrows `GrdmFileMetadataSchema` to `Ms2MibyoDbFileMetadataSchema`
- `PublicFundingFileMetadataSchema` interface: narrowed schema interface for schema ①; use after `isPublicFundingSchema` guard
- `GrdmFileMetadataData` union type: `GrdmFileMetadataFields | Ms2MibyoDbMetadataFields`; extend this union when a new schema is added

### Changed

- **Breaking**: `GrdmFileMetadataSchema.data` type changed from `GrdmFileMetadataFields` to `GrdmFileMetadataData` (union type). Direct property access on `data` now requires narrowing via type guard functions or explicit type assertion.

## [0.4.0] - 2026-03-27

### Added

- `fetch` option in `GrdmClientConfig`: inject a custom fetch function for GRDM v1 API requests. Enables proxy-based CORS workarounds in browser frontends without bypassing authentication — the library attaches the `Authorization` header before calling the custom function.
- `v1BaseUrl` now accepts relative paths (e.g. `/grdm-v1-api`) when a custom `fetch` is provided. Previously, only absolute URLs were accepted.
- **Example** (`examples/file_metadata_via_proxy.ts`): demonstrates fetching file metadata through a local reverse proxy using the new `fetch` option.

## [0.3.0] - 2026-03-27

### Added

- New file metadata fields for manuscript support in `GrdmFileMetadataFields`:
  - `grdm-file:file-type` — file type identifier (e.g., `"dataset"`, `"manuscript"`)
  - `grdm-file:doi` — DOI of the file
  - `grdm-file:manuscript-type` — manuscript type
  - `grdm-file:authors` — author(s)
  - `grdm-file:journal-name-ja` / `grdm-file:journal-name-en` — journal name
  - `grdm-file:date-published` — publication date
  - `grdm-file:volume` / `grdm-file:issue` — journal volume and issue
  - `grdm-file:page-start` / `grdm-file:page-end` — page range
  - `grdm-file:reviewed` — peer-review status
  - `grdm-file:version` — manuscript version
  - `grdm-file:publication-link` — publication URL
  - `grdm-file:dataset-link` — dataset URL

### Changed

- **Breaking**: `GrdmCreator` property names changed from camelCase to snake_case to match the raw API response:
  - `nameJa` → `name_ja`
  - `nameEn` → `name_en`
- Removed creator field conversion logic in `ProjectMetadata` — `GrdmCreator` objects are now returned as-is from the API without property renaming.

## [0.2.0] - 2026-03-20

### Added

- `GrdmFiles` resource class (`src/resources/GrdmFiles.ts`) extending the upstream `Files` class, providing a GRDM-specific extension point for file listing operations.
- `client.grdmFiles` accessor on `GrdmClient` — lazy-initialised, follows the same pattern as `projectMetadata` and `fileMetadata`.
- `client.grdmFiles.listByPath(nodeId, provider, folderPath, params?)` — lists files in a specific subfolder. Maps to `GET nodes/{nodeId}/files/{provider}/{folderPath}/` (leading slash stripped automatically).
- `client.grdmFiles.listByPathPaginated(nodeId, provider, folderPath, params?)` — same as `listByPath` but returns a `PaginatedResult` for automatic multi-page iteration.
- **Example** (`examples/file_operations.ts`): demonstrates listing root files, subfolder navigation via `grdmFiles.listByPath` and `grdmFiles.listByPathPaginated`, file download, upload, update, and delete using `GrdmClient`.

## [0.1.2] - 2026-03-02

### Fixed

- Fixed ESM build error where directory-based imports (e.g. `./types`, `./resources`, `./utils`) were incorrectly resolved as `./types.js` instead of `./types/index.js`. Updated `scripts/fix-esm-imports.mjs` to distinguish between file and directory paths when appending `.js` extensions.

## [0.1.1] - 2026-02-25

### Changed

- Added `"inlineSources": true,` to `tsconfig.json` so that the contents of source codes are embedded into their corresponding `.map` files.

## [0.1.0] - 2026-02-19

### Added

- Initial release of `grdm-api-typescript`.
- `GrdmClient` extending `OsfClient` with GRDM-specific features.
- `client.projectMetadata.listByNode(nodeId)` — fetch and parse GRDM project metadata from registrations.
- `client.projectMetadata.getById(registrationId)` — fetch a single registration with parsed metadata.
- `client.fileMetadata.getByProject(projectId)` — fetch all file metadata for a project via v1 API.
- `client.fileMetadata.findFileByPath(projectId, path)` — find file metadata by storage path.
- `client.fileMetadata.getActiveMetadata(projectId, path)` — return the active metadata schema for a file.
- Automatic `v1BaseUrl` inference from `baseUrl`.
- Automatic unwrapping of `registered_meta` `{ value, extra }` wrappers.
- Automatic parsing of `grdm-files` JSON strings into `GrdmRegisteredFile[]`.
- CJS / ESM / UMD build outputs.
- Full access to all 22 OSF API v2 resources inherited from `OsfClient`.
- **CI workflow** (`.github/workflows/ci.yml`): Runs lint, type-check, tests, and build on Node.js 20, 22, and 24 for every push and pull request targeting `main`.
- **CD workflow** (`.github/workflows/cd.yml`): Publishes the package to npm with provenance when a `v*` tag is pushed.
- **Examples** (`examples/`): Sample TypeScript scripts demonstrating common use cases.
  - `basic_usage.ts` — user info retrieval, node listing, project metadata, and file metadata.
  - `fetch_project_and_file_metadata.ts` — detailed project and file metadata retrieval for a specific node.
  - `list_all_projects.ts` — paginated listing of all accessible projects using three `PaginatedResult` patterns.
  - `examples/README.md` — usage instructions and environment variable reference for each example.

[0.6.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.6.0
[0.5.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.5.0
[0.4.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.4.0
[0.3.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.3.0
[0.2.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.2.0
[0.1.2]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.1.2
[0.1.1]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.1.1
[0.1.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.1.0
