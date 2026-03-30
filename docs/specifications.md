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
    ├── v1BaseUrl: auto-inferred or manually specified (relative path allowed when fetch is set)
    └── fetch: optional custom fetch for v1 API requests (e.g. proxy URL rewriting)
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
| `v1BaseUrl` | `string` | Auto-inferred from `baseUrl` | Base URL for v1 API. May be a relative path (e.g. `/grdm-v1-api`) when `fetch` is also provided. |
| `fetch` | `typeof fetch` | `undefined` | Custom fetch function for v1 API requests. Used to rewrite URLs for proxy-based CORS workarounds. Auth headers are injected by the library before this function is called. |

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

#### Supported Schemas

| Schema ID | Name | TypeScript constant |
|-----------|------|---------------------|
| `66d7d4ec299c4f00071be84f` | 公的資金による研究データのメタデータ | `SCHEMA_ID_PUBLIC_FUNDING` |
| `67e381081921b4000842c800` | ムーンショット目標2データベース（未病DB）のメタデータ | `SCHEMA_ID_MS2_MIBYODB` |

#### `GrdmFileMetadataSchema` Type

| Property | Type | Description |
|----------|------|-------------|
| `schema` | `string` | Schema identifier |
| `active` | `boolean` | Whether this schema is currently active |
| `data` | `GrdmFileMetadataData` | Schema-specific metadata fields (union type; see Section 5) |

`GrdmFileMetadataData` is a union type `GrdmFileMetadataFields | Ms2MibyoDbMetadataFields`. To access fields in a type-safe manner, narrow the schema with one of the type guard functions, or use an explicit type assertion.

#### Type Guard Functions

| Function | Narrows to | Schema |
|----------|-----------|--------|
| `isPublicFundingSchema(s)` | `PublicFundingFileMetadataSchema` | 公的資金による研究データのメタデータ |
| `isMs2MibyoDbSchema(s)` | `Ms2MibyoDbFileMetadataSchema` | ムーンショット目標2データベース（未病DB）のメタデータ |

Example:

```typescript
const schema = await client.fileMetadata.getActiveMetadata(projectId, path);

if (schema && isPublicFundingSchema(schema)) {
  console.log(schema.data['grdm-file:title-ja']?.value);
}

if (schema && isMs2MibyoDbSchema(schema)) {
  console.log(schema.data['grdm-file:d-msr-object-of-measurement-jp']?.value);
}
```

## 5. File Metadata Fields

### 5.1 `GrdmFileMetadataField` Type

All metadata fields (except `creators`) follow this wrapper structure:

| Property | Type | Description |
|----------|------|-------------|
| `value` | `string \| null` | The field value |
| `extra` | `unknown[]` | Additional data (typically empty) |
| `comments` | `unknown[]` | Comments (present in some responses) |

### 5.2 Schema ①: Public Funding Metadata Fields (`GrdmFileMetadataFields`)

These fields are used when `schema === SCHEMA_ID_PUBLIC_FUNDING`. Accessible after narrowing with `isPublicFundingSchema`.

#### Basic Information

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:file-type` | `file-type` | `string` | File type identifier (e.g., `"dataset"`, `"manuscript"`) |
| `grdm-file:data-number` | `data-number` | `string` | Data identifier |
| `grdm-file:doi` | `doi` | `string` | DOI of the file |
| `grdm-file:title-ja` | `title-ja` | `string` | Title in Japanese |
| `grdm-file:title-en` | `title-en` | `string` | Title in English |
| `grdm-file:authors` | `authors` | `string` | Author(s) |
| `grdm-file:date-issued-updated` | `date-issued-updated` | `string` | Date issued or last updated (ISO 8601 date) |
| `grdm-file:data-description-ja` | `data-description-ja` | `string` | Description in Japanese |
| `grdm-file:data-description-en` | `data-description-en` | `string` | Description in English |

#### Classification

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-research-field` | `data-research-field` | `string` | Research field code |
| `grdm-file:data-type` | `data-type` | `string` | Data type (e.g., "dataset", "laboratory notebook") |

#### Size

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:file-size` | `file-size` | `string` | File size as human-readable string (e.g., "1.8KB") |

#### Policy

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:data-policy-free` | `data-policy-free` | `string` | Free/restricted indicator |
| `grdm-file:data-policy-license` | `data-policy-license` | `string` | License (e.g., "Apache2", "GPL3", "OTHER") |
| `grdm-file:data-policy-cite-ja` | `data-policy-cite-ja` | `string` | Usage/provision policy in Japanese |
| `grdm-file:data-policy-cite-en` | `data-policy-cite-en` | `string` | Usage/provision policy in English |

#### Access

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:access-rights` | `access-rights` | `string` | Access rights (e.g., "open access", "metadata only access") |
| `grdm-file:available-date` | `available-date` | `string` | Date when data becomes available (ISO 8601 date) |
| `grdm-file:metadata-access-rights` | `metadata-access-rights` | `string` | Metadata access rights (e.g., "open access", "closed access") |

#### Repository

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:repo-information-ja` | `repo-information-ja` | `string` | Repository information in Japanese |
| `grdm-file:repo-information-en` | `repo-information-en` | `string` | Repository information in English |
| `grdm-file:repo-url-doi-link` | `repo-url-doi-link` | `string` | Repository URL or DOI link |
| `grdm-file:publication-link` | `publication-link` | `string` | Publication link URL |
| `grdm-file:dataset-link` | `dataset-link` | `string` | Dataset link URL |

#### Manuscript (when `grdm-file:file-type` is `"manuscript"`)

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:manuscript-type` | `manuscript-type` | `string` | Manuscript type |
| `grdm-file:journal-name-ja` | `journal-name-ja` | `string` | Journal name in Japanese |
| `grdm-file:journal-name-en` | `journal-name-en` | `string` | Journal name in English |
| `grdm-file:date-published` | `date-published` | `string` | Publication date (ISO 8601 date) |
| `grdm-file:volume` | `volume` | `string` | Journal volume |
| `grdm-file:issue` | `issue` | `string` | Journal issue |
| `grdm-file:page-start` | `page-start` | `string` | Start page |
| `grdm-file:page-end` | `page-end` | `string` | End page |
| `grdm-file:reviewed` | `reviewed` | `string` | Whether the manuscript was peer-reviewed |
| `grdm-file:version` | `version` | `string` | Manuscript version |

#### Creators

| API Key | TypeScript Property | Type | Description |
|---------|-------------------|------|-------------|
| `grdm-file:creators` | `creators` | `GrdmCreator[]` | List of creators |

`GrdmCreator` type:

| Property | Type | Description |
|----------|------|-------------|
| `number` | `string \| null` | Creator identifier (e.g., researcher number) |
| `name_ja` | `string \| null` | Creator name in Japanese |
| `name_en` | `string \| null` | Creator name in English |

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

### 5.3 Schema ②: MS2 Mibyodb Metadata Fields (`Ms2MibyoDbMetadataFields`)

These fields are used when `schema === SCHEMA_ID_MS2_MIBYODB`. Accessible after narrowing with `isMs2MibyoDbSchema`.

All field values are `string | null` (`Ms2MibyoDbMetadataField`).

The fields are grouped into six sections by file/data type. Each field key follows the pattern `grdm-file:<prefix>-<name>`.

#### Label Fields (section separators, `value` is always `null`)

| API Key | Description |
|---------|-------------|
| `grdm-file:Label-explanation` | Explanation label |
| `grdm-file:Label-measurement` | Measurement section label |
| `grdm-file:Label-folder` | Folder section label |
| `grdm-file:Label-text` | Text file section label |
| `grdm-file:Label-excel` | Excel file section label |
| `grdm-file:Label-image` | Image file section label |
| `grdm-file:Label-any` | Arbitrary file section label |

#### Measurement Data (`d-msr-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-msr-object-of-measurement-jp` | Object of measurement (Japanese) |
| `grdm-file:d-msr-object-of-measurement-en` | Object of measurement (English) |
| `grdm-file:d-msr-target-organs-for-measurement` | Target organs for measurement |
| `grdm-file:d-msr-data-type-jp` | Data type (Japanese) |
| `grdm-file:d-msr-data-type-en` | Data type (English) |
| `grdm-file:d-msr-classification-of-measuring-devices-jp` | Classification of measuring devices (Japanese) |
| `grdm-file:d-msr-classification-of-measuring-devices-en` | Classification of measuring devices (English) |
| `grdm-file:d-msr-measuring-device-name` | Measuring device name |
| `grdm-file:d-msr-procedure` | Measurement procedure |
| `grdm-file:d-msr-user-defined-metadata-items` | User-defined metadata items |
| `grdm-file:d-msr-remarks-jp` | Remarks (Japanese) |
| `grdm-file:d-msr-remarks-en` | Remarks (English) |

#### Folder (`d-fol-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-fol-Structure-or-descriptions-of-folders-jp` | Folder structure or description (Japanese) |
| `grdm-file:d-fol-remarks-jp` | Remarks (Japanese) |
| `grdm-file:d-fol-remarks-en` | Remarks (English) |

#### Text File (`d-txt-*` / `t-txt-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-txt-file-name-convention-file-extension` | File name convention / extension |
| `grdm-file:d-txt-description-jp` | Description (Japanese) |
| `grdm-file:d-txt-description-en` | Description (English) |
| `grdm-file:d-txt-description-of-row` | Description of rows |
| `grdm-file:d-txt-description-of-column` | Description of columns |
| `grdm-file:d-txt-data-preprocessing-jp` | Data preprocessing (Japanese) |
| `grdm-file:d-txt-data-preprocessing-en` | Data preprocessing (English) |
| `grdm-file:d-txt-temporal-measurement-data` | Temporal measurement data |
| `grdm-file:d-txt-number-of-rows` | Number of rows |
| `grdm-file:d-txt-number-of-columns` | Number of columns |
| `grdm-file:d-txt-approximate-number-of-similar-files` | Approximate number of similar files |
| `grdm-file:t-txt-delimiter` | Delimiter character |
| `grdm-file:t-txt-character-code` | Character encoding |
| `grdm-file:t-txt-remarks-jp` | Remarks (Japanese) |
| `grdm-file:t-txt-remarks-en` | Remarks (English) |

#### Excel File (`d-exl-*` / `t-exl-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-exl-file-name-convention-file-extension` | File name convention / extension |
| `grdm-file:d-exl-description-jp` | Description (Japanese) |
| `grdm-file:d-exl-description-en` | Description (English) |
| `grdm-file:d-exl-description-of-row` | Description of rows |
| `grdm-file:d-exl-description-of-column` | Description of columns |
| `grdm-file:d-exl-data-preprocessing-jp` | Data preprocessing (Japanese) |
| `grdm-file:d-exl-data-preprocessing-en` | Data preprocessing (English) |
| `grdm-file:d-exl-temporal-measurement-data` | Temporal measurement data |
| `grdm-file:d-exl-number-of-rows` | Number of rows |
| `grdm-file:d-exl-number-of-columns` | Number of columns |
| `grdm-file:d-exl-approximate-number-of-similar-files` | Approximate number of similar files |
| `grdm-file:t-exl-remarks-jp` | Remarks (Japanese) |
| `grdm-file:t-exl-remarks-en` | Remarks (English) |

#### Image File (`d-img-*` / `t-img-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-img-file-name-convention-file-extension` | File name convention / extension |
| `grdm-file:d-img-description-jp` | Description (Japanese) |
| `grdm-file:d-img-description-en` | Description (English) |
| `grdm-file:d-img-data-preprocessing-jp` | Data preprocessing (Japanese) |
| `grdm-file:d-img-data-preprocessing-en` | Data preprocessing (English) |
| `grdm-file:d-img-temporal-measurement-data` | Temporal measurement data |
| `grdm-file:d-img-pixel-width` | Pixel width |
| `grdm-file:d-img-pixel-height` | Pixel height |
| `grdm-file:d-img-resolution-horizontal` | Horizontal resolution |
| `grdm-file:d-img-resolution-vertical` | Vertical resolution |
| `grdm-file:d-img-approximate-number-of-similar-files` | Approximate number of similar files |
| `grdm-file:t-img-Color-Monochrome` | Color / monochrome |
| `grdm-file:t-img-number-of-color-bit` | Number of color bits |
| `grdm-file:t-img-compression-format` | Compression format |
| `grdm-file:t-img-image-type` | Image type |
| `grdm-file:t-img-remarks-jp` | Remarks (Japanese) |
| `grdm-file:t-img-remarks-en` | Remarks (English) |

#### Arbitrary File (`d-abt-*` / `t-abt-*`)

| API Key | Description |
|---------|-------------|
| `grdm-file:d-abt-file-name-convention-file-extension` | File name convention / extension |
| `grdm-file:d-abt-description-jp` | Description (Japanese) |
| `grdm-file:d-abt-description-en` | Description (English) |
| `grdm-file:d-abt-data-preprocessing-jp` | Data preprocessing (Japanese) |
| `grdm-file:d-abt-data-preprocessing-en` | Data preprocessing (English) |
| `grdm-file:d-abt-temporal-measurement-data` | Temporal measurement data |
| `grdm-file:d-abt-number-of-rows` | Number of rows |
| `grdm-file:d-abt-number-of-columns` | Number of columns |
| `grdm-file:d-abt-approximate-number-of-similar-files` | Approximate number of similar files |
| `grdm-file:d-abt-pixel-width` | Pixel width |
| `grdm-file:d-abt-pixel-height` | Pixel height |
| `grdm-file:d-abt-resolution-horizontal` | Horizontal resolution |
| `grdm-file:d-abt-resolution-vertical` | Vertical resolution |
| `grdm-file:t-abt-text/binary` | Text or binary |
| `grdm-file:t-abt-image-type` | Image type |
| `grdm-file:t-abt-Color-Monochrome` | Color / monochrome |
| `grdm-file:t-abt-number-of-color-bit` | Number of color bits |
| `grdm-file:t-abt-compression-format` | Compression format |
| `grdm-file:t-abt-delimiter` | Delimiter character |
| `grdm-file:t-abt-character-code` | Character encoding |
| `grdm-file:t-abt-user-defined-metadata-items` | User-defined metadata items |
| `grdm-file:t-abt-remarks-jp` | Remarks (Japanese) |
| `grdm-file:t-abt-remarks-en` | Remarks (English) |

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

### 8.2 File Metadata via Proxy (CORS workaround)

```typescript
// Rewrite v1 API requests to a local reverse proxy to avoid CORS errors in browsers.
// The library attaches the Authorization header before calling this function.
const grdmProxyFetch: typeof fetch = (input, init) => {
  const url = (typeof input === 'string' ? input : input.toString())
    .replace('https://rdm.nii.ac.jp/api/v1', '/grdm-v1-api');
  return fetch(url, init);
};

const client = new GrdmClient({
  token: 'your_personal_access_token',
  v1BaseUrl: 'https://rdm.nii.ac.jp/api/v1',
  fetch: grdmProxyFetch,
});

// All existing fileMetadata methods work unchanged
const metadata = await client.fileMetadata.getByProject('project_id');
```

### 8.3 File Metadata (v1 API)

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
