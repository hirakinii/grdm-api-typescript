# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-02-25

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

[0.1.0]: https://github.com/hirakinii/grdm-api-typescript/releases/tag/v0.1.0
