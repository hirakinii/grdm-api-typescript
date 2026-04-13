# GakuNin RDM API TypeScript Client

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![CI](https://github.com/hirakinii/grdm-api-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/hirakinii/grdm-api-typescript/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@hirakinii-packages%2Fgrdm-api-typescript.svg)](https://badge.fury.io/js/@hirakinii-packages%2Fgrdm-api-typescript)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

TypeScript client library for the [GakuNin RDM](https://support.rdm.nii.ac.jp/en/) API.

The GakuNin RDM API follows the [Open Science Framework (OSF) API v2](https://developer.osf.io/) and provides additional APIs for accessing project metadata and file metadata. This library extends [`osf-api-v2-typescript`](https://github.com/hirakinii/osf-api-v2-typescript) with GRDM-specific functionality.


## Features

- Full access to all 22 OSF API v2 resources (inherited from `OsfClient`)
- GRDM project metadata retrieval via v2 API (`projectMetadata`, `draftProjectMetadata`)
- GRDM file metadata retrieval and update via v1 API (`fileMetadata`)
- Multi-schema support with type-safe access for both file metadata and project metadata:
  - Schema ①: 公的資金による研究データのメタデータ (`SCHEMA_ID_PUBLIC_FUNDING`)
  - Schema ②: ムーンショット目標2データベース（未病DB）のメタデータ (`SCHEMA_ID_MS2_MIBYODB`)
  - File metadata type guard functions: `isPublicFundingSchema`, `isMs2MibyoDbSchema`
  - Project metadata discriminated union: `GrdmParsedMeta` (narrow via `schemaType`)
- Subfolder navigation via `grdmFiles.listByPath()` and `grdmFiles.listByPathPaginated()`
- Custom `fetch` injection for v1 API requests — enables proxy-based CORS workarounds in browser frontends
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
| `v1BaseUrl` | `string` | Auto-inferred from `baseUrl` | Base URL for the v1 API. May be a relative path when `fetch` is also provided. |
| `allowedHosts` | `string[]` | — | Additional allowed hosts for HTTP requests |
| `fetch` | `typeof fetch` | — | Custom fetch function for v1 API requests (e.g. for proxy-based CORS workarounds) |

`v1BaseUrl` is automatically inferred from `baseUrl` when omitted. For example, `https://api.rdm.nii.ac.jp/v2/` becomes `https://rdm.nii.ac.jp/api/v1`.

```typescript
// Default (production)
const client = new GrdmClient({ token: 'your-token' });

// Custom base URL (e.g., staging environment)
const client = new GrdmClient({
  token: 'your-token',
  baseUrl: 'https://staging.rdm.example.com/v2/',
  // v1BaseUrl is auto-inferred from baseUrl
});

// Proxy-based CORS workaround (browser frontend)
const grdmProxyFetch: typeof fetch = (input, init) =>
  fetch((input as string).replace('https://rdm.nii.ac.jp/api/v1', '/grdm-v1-api'), init);

const client = new GrdmClient({
  token: 'your-token',
  v1BaseUrl: 'https://rdm.nii.ac.jp/api/v1',
  fetch: grdmProxyFetch,
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

### `client.draftProjectMetadata`

Accesses GRDM project metadata via the v2 draft registrations API. Supports both schema ① and schema ②.

#### `listByNode(nodeId, params?)`

```typescript
const result = await client.draftProjectMetadata.listByNode('abc12');

for (const draft of result.data) {
  const meta = draft.grdmMeta;
  if (!meta) continue;

  if (meta.schemaType === 'public-funding') {
    console.log(meta.funder);
    console.log(meta.japanGrantNumber);
  } else if (meta.schemaType === 'ms2-mibyodb') {
    console.log(meta.projectName);
    console.log(meta.dataCreators?.[0].nameEn);
  }
}
```

#### `getById(draftId)`

```typescript
const draft = await client.draftProjectMetadata.getById('draft123');
if (draft.grdmMeta?.schemaType === 'ms2-mibyodb') {
  console.log(draft.grdmMeta.titleOfDataset);
}
```

#### Parsed `grdmMeta` fields — schema ① (`'public-funding'`)

Same fields as `client.projectMetadata` (see above).

#### Parsed `grdmMeta` fields — schema ② (`'ms2-mibyodb'`, `Ms2ProjectRegisteredMeta`)

| Field | Type | Source key in `registration_metadata` |
|---|---|---|
| `projectName` | `string` | `project-name` |
| `titleOfDataset` | `string` | `title-of-dataset` |
| `titleOfDatasetEn` | `string` | `title-of-dataset-en` |
| `dataCreators` | `Ms2Person[]` | `data-creator` (JSON string, auto-parsed) |
| `dataManagers` | `Ms2Person[]` | `data-manager` (JSON string, auto-parsed) |
| `keywords` | `Ms2Keyword[]` | `keywords` (JSON string, auto-parsed) |
| `datasetResearchField` | `string` | `dataset-research-field` |
| `accessRights` | `string` | `access-rights` |
| `dataPolicyFree` | `string` | `data-policy-free` |
| `dataPolicyLicense` | `string` | `data-policy-license` |
| `informedConsent` | `string` | `informed-consent` |
| `ethicsReviewCommitteeApproval` | `string` | `ethics-review-committee-approval` |
| `purposeOfExperiment` | `string` | `purpose-of-experiment` |
| `descriptionOfExperimentalCondition` | `string` | `description-of-experimental-condition` |
| `analysisType` | `string[]` | `Analysis-type` |
| `targetTypeOfAcquiredData` | `string` | `target-type-of-acquired-data` |
| `availabilityOfCommercialUse` | `string` | `availability-of-commercial-use` |
| `conflictOfInterest` | `string` | `conflict-of-interest-Yes-or-No` |
| `necessityOfContactAndPermission` | `string` | `necessity-of-contact-and-permission` |
| `namesToBeIncludedInAcknowledgments` | `string` | `names-to-be-included-in-the-acknowledgments` |
| `repositoryInformation` | `string` | `repository-information` |
| `dateRegisteredInMetadata` | `string` | `date-registered-in-metadata` |
| `disclaimerVersion` | `string` | `disclaimer-version` |
| `grdmFiles` | `GrdmRegisteredFile[]` | `grdm-files` (JSON string, auto-parsed) |
| `checklists` | `Record<string, string[]>` | `Checklist1`–`Checklist13` |

`Ms2Person`: `{ name, nameEn, belonging, belongingEn, contact }`
`Ms2Keyword`: `{ filename, filenameEn }`

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

Returns the currently active metadata schema for a file as `GrdmFileMetadataSchema | undefined`.

The `data` property is typed as `GrdmFileMetadataData` (a union of all supported schemas). Use the type guard functions to narrow to the specific schema type before accessing fields, or cast explicitly with `as`.

```typescript
import {
  isPublicFundingSchema,
  isMs2MibyoDbSchema,
} from 'grdm-api-typescript';

const schema = await client.fileMetadata.getActiveMetadata('abc12', 'osfstorage/data.csv');

// Type guard: narrows to PublicFundingFileMetadataSchema
if (schema && isPublicFundingSchema(schema)) {
  console.log(schema.data['grdm-file:title-ja']?.value);
  console.log(schema.data['grdm-file:access-rights']?.value);
}

// Type guard: narrows to Ms2MibyoDbFileMetadataSchema
if (schema && isMs2MibyoDbSchema(schema)) {
  console.log(schema.data['grdm-file:d-msr-object-of-measurement-jp']?.value);
  console.log(schema.data['grdm-file:d-msr-data-type-en']?.value);
}
```

#### `updateFileMetadata(projectId, fileItem)`

Updates the metadata of a specific file via a PATCH request to the GRDM v1 API. The target file URL is derived from `fileItem.path` (e.g., `"osfstorage/README.md"`). Returns `Promise<void>` and throws on non-2xx responses.

```typescript
const fileItem = await client.fileMetadata.findFileByPath('abc12', 'osfstorage/data.csv');

if (fileItem) {
  const updated = {
    ...fileItem,
    items: fileItem.items?.map((schema) =>
      schema.active
        ? {
            ...schema,
            data: {
              ...schema.data,
              'grdm-file:data-description-ja': {
                value: 'Updated description',
                extra: [],
                comments: [],
              },
            },
          }
        : schema,
    ) ?? [],
  };

  await client.fileMetadata.updateFileMetadata('abc12', updated);
}
```

---

### `client.grdmFiles`

Subfolder navigation within a node's storage provider (v2 Files API).

#### `listByPath(nodeId, provider, folderPath, params?)`

Lists files and folders inside a specific subfolder. The leading `/` in `folderPath` is stripped automatically.

```typescript
// List files inside the subfolder at path '/abc123/'
const result = await client.grdmFiles.listByPath('abc12', 'osfstorage', '/abc123/');

for (const item of result.data) {
  console.log(item.kind, item.name);  // 'file' | 'folder'
}
```

#### `listByPathPaginated(nodeId, provider, folderPath, params?)`

Same as `listByPath` but returns a `PaginatedResult` for automatic multi-page iteration.

```typescript
const paged = await client.grdmFiles.listByPathPaginated('abc12', 'osfstorage', '/abc123/');

// Iterate over every item across all pages
for await (const item of paged.items()) {
  console.log(item.name);
}

// Or collect everything at once
const all = await paged.toArray();
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
| [`file_metadata_via_proxy.ts`](./examples/file_metadata_via_proxy.ts) | File metadata retrieval via a reverse proxy using custom `fetch` (CORS workaround) |
| [`list_all_projects.ts`](./examples/list_all_projects.ts) | Paginated listing of all accessible projects using `PaginatedResult` |
| [`file_operations.ts`](./examples/file_operations.ts) | File listing, subfolder navigation, download, upload, update, and delete |
| [`update_grdm_file_metadata.ts`](./examples/update_grdm_file_metadata.ts) | Update a file's metadata via `updateFileMetadata`, then restore the original value |

Run examples with `ts-node`:

```bash
# Basic usage
GRDM_TOKEN=<your-token> npx ts-node examples/basic_usage.ts

# Fetch metadata for a specific node
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch_project_and_file_metadata.ts

# File metadata via proxy (CORS workaround)
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/file_metadata_via_proxy.ts

# List all projects
GRDM_TOKEN=<your-token> npx ts-node examples/list_all_projects.ts

# File operations (optionally pass a nodeId)
GRDM_TOKEN=<your-token> npx ts-node examples/file_operations.ts [nodeId]

# Update file metadata (write and restore a test value)
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> GRDM_FILE_ID=<file-id> npx ts-node examples/update_grdm_file_metadata.ts
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
