# Implementation Plan: GakuNin RDM API TypeScript Client Library

## Overview

`osf-api-v2-typescript` を継承・拡張し、GakuNin RDM 固有の Project Metadata（v2 API）と File Metadata（v1 API）を提供する TypeScript クライアントライブラリを実装する。TDD（テスト駆動開発）に従い、テストを先に書いてから実装を行う。

## Requirements

- `GrdmClient` が `OsfClient` を継承し、既存の OSF リソース 22 種を全て利用可能にする
- `osf-api-v2-typescript` の全エクスポートを再エクスポートする
- GRDM 固有のリソース `projectMetadata`（v2 API）と `fileMetadata`（v1 API）を追加する
- `v1BaseUrl` の自動推論ロジックを実装する
- 30+ のファイルメタデータフィールドの型定義を提供する
- デュアルパッケージ対応（CJS/ESM/UMD）のビルドスクリプトを作成する
- テストカバレッジ 80% 以上を達成する

### See reference if necessary

これらのファイルは `.gitignore` で同期対象となっていることに留意すること。

- `docs/reference/project-metadata.md`
- `docs/reference/file-metadata.md`

## Architecture Changes

```plaintext
src/
├── index.ts                          # メインエントリポイント（全エクスポート）
├── client.ts                         # GrdmClient クラス
├── types/
│   ├── index.ts                      # 型定義の集約エクスポート
│   ├── config.ts                     # GrdmClientConfig
│   ├── project-metadata.ts           # ProjectMetadata 関連の型
│   └── file-metadata.ts              # FileMetadata 関連の型（v1 API）
├── resources/
│   ├── index.ts                      # リソースの集約エクスポート
│   ├── ProjectMetadata.ts            # ProjectMetadata リソースクラス
│   └── FileMetadata.ts               # FileMetadata リソースクラス
└── utils/
    ├── index.ts                      # ユーティリティの集約エクスポート
    └── url.ts                        # v1BaseUrl 推論ロジック

tests/
├── setup.ts                          # Jest セットアップ（jest-fetch-mock）
├── client.test.ts                    # GrdmClient テスト
├── resources/
│   ├── ProjectMetadata.test.ts       # ProjectMetadata テスト
│   └── FileMetadata.test.ts          # FileMetadata テスト
├── utils/
│   └── url.test.ts                   # URL 推論ロジックテスト
└── fixtures/
    ├── project-metadata-response.json    # v2 API レスポンスフィクスチャ
    └── file-metadata-response.json       # v1 API レスポンスフィクスチャ

scripts/
├── fix-esm-imports.mjs               # ESM インポートパス修正
└── build-umd.mjs                     # UMD バンドルビルド
```

## Implementation Steps

### Phase 1: 基盤セットアップ

#### Step 1.1: テストセットアップファイル作成

**File:** `tests/setup.ts`

- **Action:** Jest のセットアップファイルを作成。`jest-fetch-mock` を有効化し、グローバルな `fetchMock` を設定する。
- **Why:** `jest.config.js` が `tests/setup.ts` を `setupFiles` に指定しているため、テスト実行の前提条件となる。
- **Dependencies:** なし
- **Risk:** Low

#### Step 1.2: テストフィクスチャ作成

**File:** `tests/fixtures/project-metadata-response.json`, `tests/fixtures/file-metadata-response.json`

- **Action:** `docs/reference/project-metadata.md` の実際の API レスポンス例を元に、テスト用のフィクスチャ JSON ファイルを作成する。
- **Why:** 全テストで一貫したモックデータを使用するため。
- **Dependencies:** なし
- **Risk:** Low

---

### Phase 2: 型定義（TDD: RED → GREEN）

#### Step 2.1: GrdmClientConfig 型定義

**File:** `src/types/config.ts`

- **Action (RED):** `tests/client.test.ts` に `GrdmClientConfig` の型テストを作成。`baseUrl` と `v1BaseUrl` のオプショナルプロパティ、`OsfClientConfig` の継承を検証する。
- **Action (GREEN):** `GrdmClientConfig` インターフェースを実装する。

```typescript
// src/types/config.ts
import { OsfClientConfig } from 'osf-api-v2-typescript';

export interface GrdmClientConfig extends OsfClientConfig {
  baseUrl?: string; // default: 'https://api.rdm.nii.ac.jp/v2/'
  v1BaseUrl?: string; // auto-inferred or manual
}
```

- **Dependencies:** なし
- **Risk:** Low

#### Step 2.2: ProjectMetadata 型定義

**File:** `src/types/project-metadata.ts`

- **Action (RED):** `GrdmRegisteredMeta` と `GrdmRegisteredFile` の型テストを作成。各フィールドの存在と型を検証する。
- **Action (GREEN):** 仕様書 Section 4.1 に基づいて型定義を実装する。

主な型:

```typescript
export interface GrdmRegisteredMeta {
  funder?: string;
  programNameJa?: string;
  programNameEn?: string;
  projectNameJa?: string;
  projectNameEn?: string;
  japanGrantNumber?: string;
  fundingStreamCode?: string;
  projectResearchField?: string;
  grdmFiles?: GrdmRegisteredFile[];
  registrationSupplement?: string;
}

export interface GrdmRegisteredFile {
  path: string;
  urlpath: string;
  metadata: Record<string, GrdmFileMetadataField>;
}

export interface GrdmFileMetadataField {
  value: string | null;
  extra: unknown[];
  comments?: unknown[];
}

export interface GrdmCreator {
  number: string | null;
  nameJa: string | null;
  nameEn: string | null;
}
```

- **Dependencies:** なし
- **Risk:** Low
- **注意:** API レスポンスでは `name_ja`, `name_en` (snake_case) が使われているため、`GrdmCreator` 内のプロパティ名はキャメルケース化する（変換ロジックは Phase 3 で実装）。

#### Step 2.3: FileMetadata（v1 API）型定義

**File:** `src/types/file-metadata.ts`

- **Action (RED):** `GrdmFileMetadataResponse`, `GrdmFileItem`, `GrdmFileMetadataSchema` の型テストを作成。
- **Action (GREEN):** 仕様書 Section 4.2 および Section 5 に基づいて型定義を実装する。

主な型:

```typescript
export interface GrdmFileMetadataResponse {
  data: GrdmFileMetadataProject;
}

export interface GrdmFileMetadataProject {
  id: string;
  type: string;
  attributes: GrdmFileMetadataAttributes;
}

export interface GrdmFileMetadataAttributes {
  editable: boolean;
  features: Record<string, boolean>;
  files: GrdmFileItem[];
}

export interface GrdmFileItem {
  path: string;
  hash: string;
  folder: boolean;
  urlpath: string;
  generated: boolean;
  items: GrdmFileMetadataSchema[];
}

export interface GrdmFileMetadataSchema {
  schema: string;
  active: boolean;
  // 30+ metadata fields (Section 5.2)
  [key: string]: GrdmFileMetadataField | GrdmCreator[] | string | boolean;
}
```

- **Dependencies:** Step 2.2（`GrdmFileMetadataField`, `GrdmCreator` を共有）
- **Risk:** Medium（フィールド数が多いため、型定義の正確性に注意が必要）

#### Step 2.4: 型定義のエクスポート集約

**File:** `src/types/index.ts`

- **Action:** 全型定義ファイルを集約エクスポートする。
- **Dependencies:** Step 2.1, 2.2, 2.3
- **Risk:** Low

---

### Phase 3: ユーティリティ（TDD: RED → GREEN）

#### Step 3.1: v1BaseUrl 推論ロジック

**File:** `src/utils/url.ts`

- **Action (RED):** `tests/utils/url.test.ts` に以下のテストケースを作成:
  - `https://api.rdm.nii.ac.jp/v2/` → `https://rdm.nii.ac.jp/api/v1`
  - `https://api.test.rdm.nii.ac.jp/v2/` → `https://test.rdm.nii.ac.jp/api/v1`
  - カスタム URL のケース
  - 末尾のスラッシュ有無の正規化
- **Action (GREEN):** `inferV1BaseUrl(v2BaseUrl: string): string` を実装する。

推論ロジック:

```plaintext
https://api.{subdomain}.rdm.nii.ac.jp/v2/
  → https://{subdomain}.rdm.nii.ac.jp/api/v1

https://api.rdm.nii.ac.jp/v2/
  → https://rdm.nii.ac.jp/api/v1
```

- **Dependencies:** なし
- **Risk:** Medium（URL パターンのバリエーションに注意）

#### Step 3.2: ユーティリティのエクスポート集約

**File:** `src/utils/index.ts`

- **Action:** ユーティリティモジュールを集約エクスポートする。
- **Dependencies:** Step 3.1
- **Risk:** Low

---

### Phase 4: リソースクラス（TDD: RED → GREEN）

#### Step 4.1: ProjectMetadata リソースクラス

**File:** `src/resources/ProjectMetadata.ts`

- **Action (RED):** `tests/resources/ProjectMetadata.test.ts` に以下のテストを作成:
  - `listByNode(nodeId)` — ノード ID で registrations を取得し、GRDM メタデータを解析する
  - `listByNode(nodeId, params)` — フィルターパラメータ付きの取得
  - `getById(registrationId)` — 単一の registration を取得
  - `grdm-files` フィールドの JSON パース処理
  - `registered_meta` からの値の展開処理（`{ value, extra }` → 値のみ）
  - 空のメタデータの場合のハンドリング

- **Action (GREEN):** `ProjectMetadata` クラスを実装する。

設計方針:

- `BaseResource` を継承する（`Registrations` は継承しない。既に `OsfClient.registrations` として存在するため、独立したリソースとして実装する）
- 内部的には `nodes/{nodeId}/registrations/` エンドポイントを呼び出す
- レスポンスの `registered_meta` を解析して `GrdmRegisteredMeta` に変換するロジックを含む
- `grdm-files` の JSON 文字列をパースする

```typescript
export class ProjectMetadata extends BaseResource {
  async listByNode(
    nodeId: string,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResult<GrdmProjectMetadataAttributes>>;

  async getById(registrationId: string): Promise<TransformedResource<GrdmProjectMetadataAttributes>>;
}
```

`GrdmProjectMetadataAttributes` は `OsfRegistrationAttributes` を拡張し、パース済みの `grdmMeta: GrdmRegisteredMeta` を追加する。

- **Dependencies:** Phase 2（型定義）, Phase 3（ユーティリティ）
- **Risk:** Medium（`registered_meta` のパース処理が複雑）

#### Step 4.2: FileMetadata リソースクラス

**File:** `src/resources/FileMetadata.ts`

- **Action (RED):** `tests/resources/FileMetadata.test.ts` に以下のテストを作成:
  - `getByProject(projectId)` — v1 API からファイルメタデータを取得
  - `findFileByPath(projectId, path)` — パスでファイルを検索
  - `getActiveMetadata(projectId, path)` — アクティブなメタデータスキーマを取得
  - ファイルが見つからない場合のハンドリング
  - アクティブなスキーマが存在しない場合のハンドリング

- **Action (GREEN):** `FileMetadata` クラスを実装する。

設計方針:

- `BaseResource` を直接継承せず、独自に `HttpClient` を利用する（v1 API は JSON:API 形式ではないため）
- v1 エンドポイント: `{v1BaseUrl}/project/{projectId}/metadata/project`
- レスポンスは独自の JSON 構造（JSON:API ではない）

```typescript
export class FileMetadata {
  private httpClient: HttpClient;
  private v1BaseUrl: string;

  constructor(httpClient: HttpClient, v1BaseUrl: string);

  async getByProject(projectId: string): Promise<GrdmFileMetadataResponse>;
  async findFileByPath(projectId: string, path: string): Promise<GrdmFileItem | undefined>;
  async getActiveMetadata(projectId: string, path: string): Promise<GrdmFileMetadataSchema | undefined>;
}
```

- **Dependencies:** Phase 2（型定義）
- **Risk:** Medium（v1 API は JSON:API 形式ではないため、`BaseResource` のメソッドを使用できない。`HttpClient` を直接使用してリクエストを送信する必要がある）

#### Step 4.3: リソースのエクスポート集約

**File:** `src/resources/index.ts`

- **Action:** リソースクラスを集約エクスポートする。
- **Dependencies:** Step 4.1, 4.2
- **Risk:** Low

---

### Phase 5: GrdmClient クラス（TDD: RED → GREEN）

#### Step 5.1: GrdmClient クラス実装

**File:** `src/client.ts`

- **Action (RED):** `tests/client.test.ts` に以下のテストを作成:
  - デフォルト baseUrl が `https://api.rdm.nii.ac.jp/v2/` であること
  - `v1BaseUrl` が自動推論されること
  - `v1BaseUrl` が明示指定された場合、それが使用されること
  - `projectMetadata` プロパティが `ProjectMetadata` インスタンスを返すこと
  - `fileMetadata` プロパティが `FileMetadata` インスタンスを返すこと
  - 継承元の `OsfClient` リソース（nodes, files, users 等）がアクセス可能であること
  - 各認証方式（token, tokenProvider）が動作すること

- **Action (GREEN):** `GrdmClient` クラスを実装する。

```typescript
export class GrdmClient extends OsfClient {
  private _projectMetadata?: ProjectMetadata;
  private _fileMetadata?: FileMetadata;
  private readonly v1BaseUrl: string;

  constructor(config: GrdmClientConfig = {}) {
    const baseUrl = config.baseUrl ?? 'https://api.rdm.nii.ac.jp/v2/';
    super({ ...config, baseUrl });
    this.v1BaseUrl = config.v1BaseUrl ?? inferV1BaseUrl(baseUrl);
  }

  get projectMetadata(): ProjectMetadata {
    /* lazy init */
  }
  get fileMetadata(): FileMetadata {
    /* lazy init */
  }
}
```

- **Dependencies:** Phase 2, 3, 4
- **Risk:** Medium（`OsfClient` の `httpClient` は `private` であるため、サブクラスからアクセスする方法を検討する必要がある。`(this as any).httpClient` や、独自に `HttpClient` を生成するなどのアプローチが考えられる）

**httpClient アクセスの課題と解決策:**

`OsfClient` の `httpClient` は現在 `private` 宣言されているが、`osf-api-v2-typescript` の開発者と協力して **`protected` に変更する（案 C）** を採用する。

**前提作業:** `osf-api-v2-typescript` 側で `OsfClient.httpClient` を `private` → `protected` に変更し、新バージョンをリリースする。その後、`grdm-api-typescript` の依存バージョンを更新する。

これにより:

- 型安全性が完全に維持される（`as any` キャスト不要）
- `HttpClient` インスタンスが1つで済む（重複生成しない）
- 認証状態の一貫性が保証される（親子で同じ `httpClient` を共有）

---

### Phase 6: エントリポイントと再エクスポート

#### Step 6.1: メインエントリポイント

**File:** `src/index.ts`

- **Action:** 全モジュールのエクスポートを集約する。
  - `osf-api-v2-typescript` からの再エクスポート（`export * from 'osf-api-v2-typescript'`）
  - GRDM 固有の型、リソース、クライアント、ユーティリティのエクスポート

```typescript
// Re-export everything from osf-api-v2-typescript
export * from 'osf-api-v2-typescript';

// GRDM-specific exports
export { GrdmClient } from './client';
export type { GrdmClientConfig } from './types/config';
export * from './types';
export * from './resources';
export * from './utils';
```

- **Dependencies:** Phase 5
- **Risk:** Low（名前衝突の可能性があるため、エクスポート名を確認する必要がある）

---

### Phase 7: ビルドスクリプト

#### Step 7.1: ESM インポート修正スクリプト

**File:** `scripts/fix-esm-imports.mjs`

- **Action:** ESM ビルド時にインポートパスに `.js` 拡張子を付与するスクリプトを作成する。`osf-api-v2-typescript` の同等スクリプトを参考にする。
- **Dependencies:** なし
- **Risk:** Low

#### Step 7.2: UMD ビルドスクリプト

**File:** `scripts/build-umd.mjs`

- **Action:** UMD バンドルを生成するビルドスクリプトを作成する。esbuild または rollup を使用する。
- **Dependencies:** なし
- **Risk:** Low

---

### Phase 8: ビルド・リント・テスト検証

#### Step 8.1: ビルド検証

- **Action:** `npm run build` を実行し、CJS/ESM/UMD の全ビルドが成功することを確認する。
- **Dependencies:** Phase 7
- **Risk:** Medium

#### Step 8.2: リント・フォーマット検証

- **Action:** `npm run lint` と `npm run format` を実行し、コードスタイルが一貫していることを確認する。
- **Dependencies:** Phase 6
- **Risk:** Low

#### Step 8.3: テストカバレッジ検証

- **Action:** `npm run test` を実行し、テストカバレッジが 80% 以上であることを確認する。
- **Dependencies:** Phase 5
- **Risk:** Low

---

## Testing Strategy

### Unit Tests

| テスト対象       | テストファイル                            | テスト内容                     |
| ---------------- | ----------------------------------------- | ------------------------------ |
| URL 推論ロジック | `tests/utils/url.test.ts`                 | 各 URL パターンの変換結果      |
| GrdmClient       | `tests/client.test.ts`                    | 設定、リソースアクセス、認証   |
| ProjectMetadata  | `tests/resources/ProjectMetadata.test.ts` | API 呼び出し、レスポンスパース |
| FileMetadata     | `tests/resources/FileMetadata.test.ts`    | API 呼び出し、ファイル検索     |

### Integration Tests

- `jest-fetch-mock` を使用してHTTPリクエストをモックし、実際のAPIレスポンスに近いフィクスチャで検証する。
- `GrdmClient` → `ProjectMetadata`/`FileMetadata` のエンドツーエンドフローを検証する。

### E2E Tests

- 実際の GRDM API サーバーに対する E2E テストは、CI/CD パイプラインで環境変数 `GRDM_TOKEN` が設定されている場合にのみ実行する（将来的な拡張）。

---

## Risks & Mitigations

### Risk 1: `OsfClient.httpClient` が private（解決済み）

- **説明:** `OsfClient` の `httpClient` は `private` であるため、`GrdmClient` から直接アクセスできない。
- **軽減策:** `osf-api-v2-typescript` 側で `httpClient` を `protected` に変更する。これにより `GrdmClient` から `this.httpClient` で型安全にアクセスできる。
- **前提作業:** `osf-api-v2-typescript` の修正・リリース後、依存バージョンを更新する。

### Risk 2: v1 API が JSON:API 形式ではない

- **説明:** `FileMetadata` の v1 API は JSON:API 形式ではないため、`BaseResource` の `get()` / `list()` メソッドが使えない。
- **軽減策:** `FileMetadata` クラスでは `HttpClient.get()` を直接使用し、独自のレスポンスパースロジックを実装する。

### Risk 3: `registered_meta` の構造が複雑

- **説明:** `registered_meta` は `{ value, extra }` ラッパー構造で、`grdm-files` は JSON 文字列としてエンコードされている。
- **軽減策:** 専用のパースユーティリティを実装し、テストフィクスチャで各パターンを網羅的に検証する。

### Risk 4: `osf-api-v2-typescript` との名前衝突

- **説明:** `export *` での再エクスポート時に、GRDM 固有の型名が OSF の型名と衝突する可能性がある。
- **軽減策:** GRDM 固有の型名にはすべて `Grdm` プレフィックスを付与する（例: `GrdmClient`, `GrdmFileItem`, `GrdmRegisteredMeta`）。

---

## Success Criteria

- [x] `GrdmClient` が `OsfClient` を正しく継承し、全 22 種の OSF リソースにアクセスできる
- [x] `osf-api-v2-typescript` の全エクスポートが `grdm-api-typescript` から再エクスポートされる
- [x] `client.projectMetadata.listByNode(nodeId)` で v2 API からプロジェクトメタデータを取得できる
- [x] `client.projectMetadata.getById(registrationId)` で単一の登録メタデータを取得できる
- [x] `client.fileMetadata.getByProject(projectId)` で v1 API からファイルメタデータを取得できる
- [x] `client.fileMetadata.findFileByPath(projectId, path)` でファイルをパスで検索できる
- [x] `client.fileMetadata.getActiveMetadata(projectId, path)` でアクティブなメタデータを取得できる
- [x] `v1BaseUrl` が `baseUrl` から正しく自動推論される
- [x] `registered_meta` の `{ value, extra }` ラッパーが自動的に展開される
- [x] `grdm-files` の JSON 文字列が `GrdmRegisteredFile[]` に自動パースされる
- [x] `npm run build` で CJS/ESM/UMD ビルドが成功する
- [x] `npm run test` でテストカバレッジ 80% 以上を達成する（実績: 100%）
- [x] `npm run lint` がエラーなしで通過する
- [x] 全型定義が正確で、TypeScript の strict モードでコンパイルが通る

## Implementation Order Summary

```plaintext
Phase 1: 基盤セットアップ        (tests/setup.ts, fixtures)
    ↓
Phase 2: 型定義                  (src/types/)
    ↓
Phase 3: ユーティリティ            (src/utils/)
    ↓
Phase 4: リソースクラス            (src/resources/)
    ↓
Phase 5: GrdmClient クラス       (src/client.ts)
    ↓
Phase 6: エントリポイント          (src/index.ts)
    ↓
Phase 7: ビルドスクリプト          (scripts/)
    ↓
Phase 8: ビルド・リント・テスト検証
```

各 Phase 内で TDD サイクル（RED → GREEN → REFACTOR）を繰り返す。
