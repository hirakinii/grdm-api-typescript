# GakuNin RDM API TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/hirakinii/grdm-api-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/hirakinii/grdm-api-typescript/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/grdm-api-typescript.svg)](https://www.npmjs.com/package/grdm-api-typescript)

TypeScript client library for the [GakuNin RDM](https://support.rdm.nii.ac.jp/en/) API.

The GakuNin RDM API follows the [Open Science Framework (OSF) API v2](https://developer.osf.io/) and provides additional APIs for accessing project metadata and file metadata. This library extends [`osf-api-v2-typescript`](https://github.com/hirakinii/osf-api-v2-typescript) with GRDM-specific functionality.


## Features

- Full access to all 22 OSF API v2 resources (inherited from `OsfClient`)
- GRDM project metadata retrieval via v2 API (`projectMetadata`)
- GRDM file metadata retrieval via v1 API (`fileMetadata`)
- Automatic `v1BaseUrl` inference from `baseUrl`
- Automatic unwrapping of `registered_meta` `{ value, extra }` wrappers
- Automatic parsing of `grdm-files` JSON strings into typed objects
- CJS / ESM / UMD build outputs


## Installation

```bash
npm install grdm-api-typescript
```


## Quick Start

```typescript
import { GrdmClient } from 'grdm-api-typescript';

const client = new GrdmClient({ token: 'your-personal-access-token' });

// Fetch project metadata for a node
const metaList = await client.projectMetadata.listByNode('abc12');
console.log(metaList.data[0].grdmMeta?.projectNameJa);

// Fetch file metadata for a project
const activeSchema = await client.fileMetadata.getActiveMetadata('abc12', 'osfstorage/README.md');
console.log(activeSchema);
```


## Configuration

`GrdmClient` accepts a `GrdmClientConfig` object:

| Option | Type | Default | Description |
|---|---|---|---|
| `token` | `string` | — | Personal access token for authentication |
| `baseUrl` | `string` | `https://api.rdm.nii.ac.jp/v2/` | Base URL for the v2 API |
| `v1BaseUrl` | `string` | Auto-inferred from `baseUrl` | Base URL for the v1 API |
| `allowedHosts` | `string[]` | — | Additional allowed hosts for HTTP requests |

`v1BaseUrl` is automatically inferred from `baseUrl` when omitted. For example, `https://api.rdm.nii.ac.jp/v2/` becomes `https://api.rdm.nii.ac.jp/v1/`.

```typescript
// Default (production)
const client = new GrdmClient({ token: 'your-token' });

// Custom base URL (e.g., staging environment)
const client = new GrdmClient({
  token: 'your-token',
  baseUrl: 'https://staging.rdm.example.com/v2/',
  // v1BaseUrl is auto-inferred as 'https://staging.rdm.example.com/v1/'
});

// Explicit v1BaseUrl
const client = new GrdmClient({
  token: 'your-token',
  baseUrl: 'https://api.rdm.nii.ac.jp/v2/',
  v1BaseUrl: 'https://api.rdm.nii.ac.jp/v1/',
});
```


## API Reference

### `client.projectMetadata`

Accesses the GRDM project metadata via the v2 API.

#### `listByNode(nodeId, params?)`

Fetches the list of registrations for a node and parses the GRDM metadata.

```typescript
const result = await client.projectMetadata.listByNode('abc12');

for (const item of result.data) {
  console.log(item.grdmMeta?.projectNameJa);  // e.g. 'プロジェクト名'
  console.log(item.grdmMeta?.funder);
  console.log(item.grdmMeta?.grdmFiles);      // GrdmRegisteredFile[]
}
```

#### `getById(registrationId)`

Fetches a single registration by ID and parses the GRDM metadata.

```typescript
const item = await client.projectMetadata.getById('reg123');
console.log(item.grdmMeta?.projectNameEn);
```

#### Parsed `grdmMeta` fields

| Field | Type | Source key in `registered_meta` |
|---|---|---|
| `funder` | `string` | `funder` |
| `programNameJa` | `string` | `program-name-ja` |
| `programNameEn` | `string` | `program-name-en` |
| `projectNameJa` | `string` | `project-name-ja` |
| `projectNameEn` | `string` | `project-name-en` |
| `japanGrantNumber` | `string` | `japan-grant-number` |
| `fundingStreamCode` | `string` | `funding-stream-code` |
| `projectResearchField` | `string` | `project-research-field` |
| `registrationSupplement` | `string` | `registration_supplement` |
| `grdmFiles` | `GrdmRegisteredFile[]` | `grdm-files` (JSON string, auto-parsed) |

The `{ value, extra }` wrapper in `registered_meta` is automatically unwrapped.

---

### `client.fileMetadata`

Accesses the GRDM file metadata via the v1 API.

#### `getByProject(projectId)`

Fetches all file metadata for a project.

```typescript
const response = await client.fileMetadata.getByProject('abc12');
console.log(response.data.attributes.files);
```

#### `findFileByPath(projectId, path)`

Finds a specific file's metadata by its storage path.

```typescript
const file = await client.fileMetadata.findFileByPath('abc12', 'osfstorage/data.csv');
console.log(file?.items);
```

#### `getActiveMetadata(projectId, path)`

Returns the currently active metadata schema for a file.

```typescript
const schema = await client.fileMetadata.getActiveMetadata('abc12', 'osfstorage/data.csv');
if (schema) {
  console.log(schema.metadata);
}
```

---

### OSF Resources (inherited)

All 22 OSF API v2 resources from `OsfClient` are available directly on `GrdmClient`:

```typescript
// Nodes
const nodes = await client.nodes.list();

// Files
const files = await client.files.list('abc12');

// Users, Registrations, Institutions, etc.
const user = await client.users.getMe();
```

For the full list of OSF resources, see the [`osf-api-v2-typescript` documentation](https://github.com/hirakinii/osf-api-v2-typescript).


## Examples

The [`examples/`](./examples/) directory contains sample scripts demonstrating common use cases:

| Example | Description |
|---|---|
| [`basic_usage.ts`](./examples/basic_usage.ts) | Basic operations: user info, node list, project metadata, file metadata |
| [`fetch_project_and_file_metadata.ts`](./examples/fetch_project_and_file_metadata.ts) | Detailed project and file metadata retrieval for a specific node |
| [`list_all_projects.ts`](./examples/list_all_projects.ts) | Paginated listing of all accessible projects using `PaginatedResult` |

Run examples with `ts-node`:

```bash
# Basic usage
GRDM_TOKEN=<your-token> npx ts-node examples/basic_usage.ts

# Fetch metadata for a specific node
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch_project_and_file_metadata.ts

# List all projects
GRDM_TOKEN=<your-token> npx ts-node examples/list_all_projects.ts
```

See [`examples/README.md`](./examples/README.md) for details on each example and available environment variables.


## Development

### Install dependencies

```bash
npm install
```

### Build (CJS / ESM / UMD)

```bash
npm run build
```

### Run tests

```bash
npm run test
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```


## CI / CD

This project uses GitHub Actions for continuous integration and delivery.

| Workflow | Trigger | Description |
|---|---|---|
| [CI](./.github/workflows/ci.yml) | Push / PR to `main` | Lint, type-check, test, and build on Node.js 20, 22, and 24 |
| [CD](./.github/workflows/cd.yml) | Push of `v*` tag | Run tests and publish to npm with provenance |

To release a new version, create and push a version tag:

```bash
npm version patch   # or minor / major
git push --follow-tags
```


## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.
