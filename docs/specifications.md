# grdm-api-typescript Specifications

## 1. Overview

GakuNin RDM API TypeScript client library built on top of `osf-api-v2-typescript`.

GakuNin RDM API is based on the [OSF API v2](https://developer.osf.io/) and extends it with additional endpoints for project metadata and file metadata management specific to the Japanese research data management ecosystem.

This library inherits all OSF API v2 functionality from `osf-api-v2-typescript` and adds GRDM-specific resource classes and type definitions.

## 2. Architecture

### 2.1 Design Principle

- **Inheritance + Extension**: `GrdmClient` extends `OsfClient` from `osf-api-v2-typescript`.
- **Full re-export**: All exports from `osf-api-v2-typescript` (types, errors, `PaginatedResult`, etc.) are re-exported so that users only need to import from `grdm-api-typescript`.
- **Dual API version support**: Both v2 (OSF-compatible) and v1 (GRDM-specific) endpoints are supported.

### 2.2 Client Class Hierarchy

```
GrdmClient extends OsfClient
├── Inherited OSF Resources (22 resource types)
│   ├── nodes, files, users, registrations, contributors
│   ├── institutions, preprints, draftRegistrations, collections
│   ├── wikis, comments, logs, subjects, licenses
│   ├── viewOnlyLinks, identifiers, citations
│   ├── preprintProviders, registrationProviders, collectionProviders
│   └── scopes, applications, tokens
├── GRDM-specific Resources (new)
│   ├── projectMetadata  — via v2 registrations endpoint
│   └── fileMetadata     — via v1 metadata endpoint
└── Configuration
    ├── baseUrl: 'https://api.rdm.nii.ac.jp/v2/' (default)
    └── v1BaseUrl: auto-inferred or manually specified
```

### 2.3 Authentication

All authentication methods supported by `OsfClient` are inherited:

- **Personal Access Token (PAT)**: Simple token-based authentication.
- **OAuth2 + PKCE**: Authorization Code flow with PKCE for browser-based apps.
- **Custom token provider**: User-defined async function to provide fresh tokens.

## 3. Configuration

### 3.1 `GrdmClientConfig`

Extends `OsfClientConfig` with the following additional options:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `baseUrl` | `string` | `https://api.rdm.nii.ac.jp/v2/` | Base URL for v2 API |
| `v1BaseUrl` | `string` | Auto-inferred from `baseUrl` | Base URL for v1 API (e.g., `https://rdm.nii.ac.jp/api/v1`) |

### 3.2 Base URL Inference

When `v1BaseUrl` is not explicitly provided, it is inferred from `baseUrl`:

- `https://api.rdm.nii.ac.jp/v2/` → `https://rdm.nii.ac.jp/api/v1`
- `https://api.test.rdm.nii.ac.jp/v2/` → `https://test.rdm.nii.ac.jp/api/v1`

## 4. GRDM-specific Resources

### 4.1 Project Metadata (`ProjectMetadata`) — v2 API

#### Endpoint

```
GET /v2/nodes/{node_id}/registrations
```

#### Description

Retrieves registration metadata for a GRDM project. The GRDM platform uses the OSF registrations mechanism to store structured project metadata, including research funding information and file-level metadata.

#### Methods

| Method | Description |
|--------|-------------|
| `listByNode(nodeId, params?)` | List registrations (with GRDM metadata) for a node |
| `getById(registrationId)` | Get a single registration with parsed GRDM metadata |

#### GRDM-specific Fields in `registered_meta`

These fields are extracted from the `registered_meta` / `registration_responses` attributes of registration resources:

| Field Key | TypeScript Property | Type | Description |
|-----------|-------------------|------|-------------|
| `funder` | `funder` | `string` | Funding agency (e.g., "JSPS") |
| `program-name-ja` | `programNameJa` | `string` | Program name in Japanese |
| `program-name-en` | `programNameEn` | `string` | Program name in English |
| `project-name-ja` | `projectNameJa` | `string` | Project name in Japanese |
| `project-name-en` | `projectNameEn` | `string` | Project name in English |
| `japan-grant-number` | `japanGrantNumber` | `string` | Japan grant number |
| `funding-stream-code` | `fundingStreamCode` | `string` | Funding stream code |
| `project-research-field` | `projectResearchField` | `string` | Research field code |
| `grdm-files` | `grdmFiles` | `GrdmRegisteredFile[]` | File metadata entries (parsed from JSON string) |
| `registration_supplement` | `registrationSupplement` | `string` | Registration schema name |

#### `GrdmRegisteredFile` Type

Represents a file entry within the `grdm-files` field of `registered_meta`:

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | File/folder path (e.g., `osfstorage/README.md`) |
| `urlpath` | `string` | URL path for the file |
| `metadata` | `Record<string, GrdmFileMetadataField>` | Metadata key-value pairs |

### 4.2 File Metadata (`FileMetadata`) — v1 API

#### Endpoint

```
GET /api/v1/project/{project_id}/metadata/project
```

#### Description

Retrieves the complete file metadata for a GRDM project, including all files and folders with their associated metadata schemas. This is a GRDM-specific v1 API endpoint.

#### Methods

| Method | Description |
|--------|-------------|
| `getByProject(projectId)` | Get all file metadata for a project |
| `findFileByPath(projectId, path)` | Find a specific file's metadata by path |
| `getActiveMetadata(projectId, path)` | Get the active metadata schema for a specific file |

#### Response Type: `GrdmFileMetadataResponse`

```
GrdmFileMetadataResponse
└── data: GrdmFileMetadataProject
    ├── id: string
    ├── type: string
    └── attributes: GrdmFileMetadataAttributes
        ├── editable: boolean
        ├── features: Record<string, boolean>
        └── files: GrdmFileItem[]
```

#### `GrdmFileItem` Type

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | File or folder path (e.g., `osfstorage/README.md`) |
| `hash` | `string` | File hash |
| `folder` | `boolean` | Whether this item is a folder |
| `urlpath` | `string` | URL path |
| `generated` | `boolean` | Whether this item was auto-generated |
| `items` | `GrdmFileMetadataSchema[]` | Associated metadata schemas |

#### `GrdmFileMetadataSchema` Type

| Property | Type | Description |
|----------|------|-------------|
| `schema` | `string` | Schema identifier |
| `active` | `boolean` | Whether this schema is currently active |
| (data fields) | `GrdmFileMetadataField` | See Section 5 for the full field list |

## 5. File Metadata Fields

The following fields are common to both v1 and v2 representations of GRDM file metadata.

### 5.1 `GrdmFileMetadataField` Type

All metadata fields (except `creators`) follow this wrapper structure:

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string \| null` | The field value |
| `extra` | `unknown[]` | Additional data (typically empty) |
| `comments` | `unknown[]` | Comments (present in some responses) |

### 5.2 Field Definitions

#### Basic Information

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-number` | `dataNumber` | `string` | Data identifier |
| `grdm-file:title-ja` | `titleJa` | `string` | Title in Japanese |
| `grdm-file:title-en` | `titleEn` | `string` | Title in English |
| `grdm-file:date-issued-updated` | `dateIssuedUpdated` | `string` | Date issued or last updated (ISO 8601 date) |
| `grdm-file:data-description-ja` | `dataDescriptionJa` | `string` | Description in Japanese |
| `grdm-file:data-description-en` | `dataDescriptionEn` | `string` | Description in English |

#### Classification

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-research-field` | `dataResearchField` | `string` | Research field code |
| `grdm-file:data-type` | `dataType` | `string` | Data type (e.g., "dataset", "laboratory notebook") |

#### Size

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:file-size` | `fileSize` | `string` | File size as human-readable string (e.g., "1.8KB") |

#### Policy

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-policy-free` | `dataPolicyFree` | `string` | Free/restricted indicator |
| `grdm-file:data-policy-license` | `dataPolicyLicense` | `string` | License (e.g., "Apache2", "GPL3", "OTHER") |
| `grdm-file:data-policy-cite-ja` | `dataPolicyCiteJa` | `string` | Usage/provision policy in Japanese |
| `grdm-file:data-policy-cite-en` | `dataPolicyCiteEn` | `string` | Usage/provision policy in English |

#### Access

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:access-rights` | `accessRights` | `string` | Access rights (e.g., "open access", "metadata only access") |
| `grdm-file:available-date` | `availableDate` | `string` | Date when data becomes available (ISO 8601 date) |
| `grdm-file:metadata-access-rights` | `metadataAccessRights` | `string` | Metadata access rights (e.g., "open access", "closed access") |

#### Repository

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:repo-information-ja` | `repoInformationJa` | `string` | Repository information in Japanese |
| `grdm-file:repo-information-en` | `repoInformationEn` | `string` | Repository information in English |
| `grdm-file:repo-url-doi-link` | `repoUrlDoiLink` | `string` | Repository URL or DOI link |

#### Creators

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:creators` | `creators` | `GrdmCreator[]` | List of creators |

`GrdmCreator` type:

| Property | Type | Description |
|----------|------|-------------|
| `number` | `string \| null` | Creator identifier (e.g., researcher number) |
| `nameJa` | `string \| null` | Creator name in Japanese |
| `nameEn` | `string \| null` | Creator name in English |

#### Hosting Institution

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:hosting-inst-ja` | `hostingInstJa` | `string` | Institution name in Japanese |
| `grdm-file:hosting-inst-en` | `hostingInstEn` | `string` | Institution name in English |
| `grdm-file:hosting-inst-id` | `hostingInstId` | `string` | Institution identifier (e.g., ROR URL) |

#### Data Manager

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-man-type` | `dataManType` | `string` | Manager type (e.g., "individual") |
| `grdm-file:data-man-number` | `dataManNumber` | `string` | Manager identifier |
| `grdm-file:data-man-name-ja` | `dataManNameJa` | `string` | Manager name in Japanese |
| `grdm-file:data-man-name-en` | `dataManNameEn` | `string` | Manager name in English |
| `grdm-file:data-man-org-ja` | `dataManOrgJa` | `string` | Manager organization in Japanese |
| `grdm-file:data-man-org-en` | `dataManOrgEn` | `string` | Manager organization in English |
| `grdm-file:data-man-address-ja` | `dataManAddressJa` | `string` | Manager address in Japanese |
| `grdm-file:data-man-address-en` | `dataManAddressEn` | `string` | Manager address in English |
| `grdm-file:data-man-tel` | `dataManTel` | `string` | Manager phone number |
| `grdm-file:data-man-email` | `dataManEmail` | `string` | Manager email address |

#### Remarks

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:remarks-ja` | `remarksJa` | `string` | Remarks in Japanese |
| `grdm-file:remarks-en` | `remarksEn` | `string` | Remarks in English |

## 6. Utility Functions

### 6.1 Metadata Flattening

The `registered_meta` fields in v2 API responses use a wrapper structure:

```json
{ "value": "actual_value", "extra": [] }
```

The library automatically extracts the `value` from this structure and provides direct access to the unwrapped values.

### 6.2 `grdm-files` Parser

The `grdm-files` field in `registered_meta` stores file metadata as a JSON string. The library automatically parses this string into typed `GrdmRegisteredFile[]` objects.

### 6.3 Helper Methods

| Method | Description |
|--------|-------------|
| `findFileByPath(path)` | Search for a `GrdmFileItem` by its path |
| `getActiveMetadata(fileItem)` | Get the active metadata schema from a file item's `items` array |
| `getMetadataValue(fileItem, fieldKey)` | Get a specific metadata field value from the active schema |

## 7. Re-exports

The following are re-exported from `osf-api-v2-typescript`:

- All resource classes (Nodes, Files, Users, etc.)
- All type definitions (OsfNode, OsfFile, OsfUser, etc.)
- Error classes (OsfNotFoundError, OsfPermissionError, OsfRateLimitError, etc.)
- PaginatedResult
- HttpClient, JsonApiAdapter
- OsfOAuth2Client and related auth types
- OsfClient and OsfClientConfig

## 8. Usage Examples

### 8.1 Basic Usage

```typescript
import { GrdmClient } from 'grdm-api-typescript';

const client = new GrdmClient({
  token: 'your_personal_access_token',
  // baseUrl defaults to 'https://api.rdm.nii.ac.jp/v2/'
});

// Use inherited OSF resources
const me = await client.users.me();
const nodes = await client.nodes.listNodes();

// Use GRDM-specific resources
const metadata = await client.fileMetadata.getByProject('project_id');
const registrations = await client.projectMetadata.listByNode('node_id');
```

### 8.2 File Metadata (v1 API)

```typescript
// Get all file metadata for a project
const response = await client.fileMetadata.getByProject('uzdsn');

// Find a specific file
const readme = response.findFileByPath('osfstorage/README.md');

// Get active metadata
const activeMetadata = readme?.items.find(item => item.active);
console.log(activeMetadata?.titleJa); // "プロジェクト用README"
console.log(activeMetadata?.creators); // [{ number: "10880916", nameJa: "平木俊幸", ... }]
```

### 8.3 Project Metadata (v2 API via Registrations)

```typescript
// Get registrations with GRDM metadata
const registrations = await client.projectMetadata.listByNode('uzdsn');

for (const reg of registrations.data) {
  console.log(reg.registrationSupplement); // "公的資金による研究データのメタデータ登録"
  console.log(reg.grdmMeta?.funder);       // "JSPS"
  console.log(reg.grdmMeta?.projectNameEn); // "Investigation of size dependence of xxx"

  // Access parsed file metadata from registered_meta
  for (const file of reg.grdmMeta?.grdmFiles ?? []) {
    console.log(file.path, file.metadata['grdm-file:title-en']?.value);
  }
}
```
