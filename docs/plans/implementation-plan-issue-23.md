# Implementation Plan: Issue #23 — Draft Registrations からの GRDM プロジェクトメタデータ取得

## 背景

GakuNin RDM がプロジェクトメタデータの登録先を Registrations から Draft Registrations に切り替えた。
既存の `projectMetadata` リソース（Registrations ベース）に加え、`draft_registrations` エンドポイントからも
同様の GRDM メタデータを取得・パースできる機能を追加する。

---

## 現状分析

### Registrations vs Draft Registrations の差異

| 比較項目 | Registrations（既存） | Draft Registrations（追加対象） |
|---|---|---|
| 一覧エンドポイント | `nodes/{nodeId}/registrations/` | `nodes/{nodeId}/draft_registrations/` |
| 単体エンドポイント | `registrations/{id}/` | `draft_registrations/{id}/` |
| 基底型 | `OsfRegistrationAttributes` | `OsfDraftRegistrationAttributes` |
| メタデータフィールド | `registered_meta` | `registration_metadata` |
| 補足フィールド | `registration_supplement`（attributes の直接フィールド） | **なし** |
| ラッパー構造 | `{ value, extra, comments }` | **同じ構造** |

`registration_metadata` と `registered_meta` は**同一のラッパー構造**を持つため、パース処理を共通化できる。

---

## 実装方針

### 設計の核心：共通パースロジックの抽出

`ProjectMetadata` のプライベートメソッドだった `parseGrdmMeta` / `parseGrdmFiles` を
純粋関数として `src/utils/parseGrdmMeta.ts` に切り出し、両リソースから再利用する。

---

## 変更ファイル一覧

### 新規作成

| ファイル | 内容 |
|---|---|
| `src/utils/parseGrdmMeta.ts` | `parseGrdmMetaRecord()` と `parseGrdmFiles()` の純粋関数 |
| `src/resources/DraftProjectMetadata.ts` | Draft Registration メタデータ取得リソースクラス |
| `tests/resources/DraftProjectMetadata.test.ts` | TDD テスト（先行作成） |
| `tests/fixtures/draft-registration-response.json` | テスト用フィクスチャ（サンプル JSON から生成） |

### 修正

| ファイル | 変更内容 |
|---|---|
| `src/types/project-metadata.ts` | `GrdmDraftProjectMetadataAttributes` 型を追加 |
| `src/resources/ProjectMetadata.ts` | プライベートメソッドを共通ユーティリティ呼び出しに変更 |
| `src/resources/index.ts` | `DraftProjectMetadata` を追加エクスポート |
| `src/utils/index.ts` | `parseGrdmMeta` ユーティリティを追加エクスポート |
| `src/client.ts` | `draftProjectMetadata` プロパティを追加 |
| `src/index.ts` | 新型・新クラスの再エクスポートを確認（`*` 経由で自動） |
| `examples/fetch_grdm_project_metadata.ts` | Draft Registration メタデータ取得のサンプルコードを追加 |

---

## 詳細設計

### 1. `src/utils/parseGrdmMeta.ts`

```typescript
import { GrdmRegisteredMeta, GrdmRegisteredFile, GrdmFileMetadataField } from '../types/project-metadata';

/**
 * Parse GRDM metadata from a raw registration_metadata / registered_meta record.
 * Both registrations and draft registrations use the same { value, extra, comments } wrapper.
 */
export function parseGrdmMetaRecord(metaRecord: Record<string, unknown>): GrdmRegisteredMeta;

/**
 * Parse grdm-files JSON string into typed GrdmRegisteredFile array.
 */
export function parseGrdmFiles(files: Record<string, unknown>[]): GrdmRegisteredFile[];
```

`parseGrdmMetaRecord` は `registered_meta` / `registration_metadata` どちらからも呼び出せる。
`registration_supplement` は Registration 専用フィールドのため、
`ProjectMetadata` 側で引き続き `attributes.registration_supplement` から読み取る。

### 2. `src/types/project-metadata.ts` への追加

```typescript
import { OsfDraftRegistrationAttributes } from 'osf-api-v2-typescript';

/**
 * Extended draft registration attributes including parsed GRDM metadata.
 */
export interface GrdmDraftProjectMetadataAttributes extends OsfDraftRegistrationAttributes {
  grdmMeta?: GrdmRegisteredMeta;
}
```

### 3. `src/resources/DraftProjectMetadata.ts`

```typescript
export class DraftProjectMetadata extends BaseResource {
  /**
   * List draft registrations for a node and parse GRDM metadata.
   * Calls: nodes/{nodeId}/draft_registrations/
   */
  async listByNode(
    nodeId: string,
    params?: Record<string, unknown>,
  ): Promise<TransformedList<GrdmDraftProjectMetadataAttributes>>;

  /**
   * Get a single draft registration by ID and parse GRDM metadata.
   * Calls: draft_registrations/{id}/
   */
  async getById(
    draftId: string,
  ): Promise<TransformedResource<GrdmDraftProjectMetadataAttributes>>;
}
```

内部では `parseGrdmMetaRecord(attributes.registration_metadata)` を呼ぶ。
`registration_supplement` は Draft にないため設定しない。

### 4. `src/client.ts` への追加

```typescript
import { DraftProjectMetadata } from './resources/DraftProjectMetadata';

export class GrdmClient extends OsfClient {
  private _draftProjectMetadata?: DraftProjectMetadata;

  /**
   * Access the DraftProjectMetadata resource (GRDM v2 API)
   *
   * Provides methods for fetching and parsing GRDM project metadata
   * from OSF draft registrations.
   */
  get draftProjectMetadata(): DraftProjectMetadata {
    if (!this._draftProjectMetadata) {
      this._draftProjectMetadata = new DraftProjectMetadata(this.httpClient);
    }
    return this._draftProjectMetadata;
  }
}
```

---

## TDD 実装手順

### Step 1: RED — テストを先に書く

`tests/fixtures/draft-registration-response.json` を作成（`docs/reference/draft_registration_sample_public_funding.json` を JSON:API list 形式にラップ）。

`tests/resources/DraftProjectMetadata.test.ts` を作成し、以下のテストケースを定義：
- `listByNode`: ノード ID で Draft Registration 一覧取得 + GRDM メタデータパース
- `listByNode`: 空の `registration_metadata` を適切に処理
- `listByNode`: `registration_metadata` が未定義の場合を適切に処理
- `listByNode`: `grdm-files` フィールドのパース
- `getById`: 単体 Draft Registration 取得 + GRDM メタデータパース
- `getById`: `registration_supplement` が設定されないことを確認

テスト実行 → **FAIL** を確認。

### Step 2: GREEN — 最小実装

上記変更ファイルを順番に実装してテストをパスさせる。

### Step 3: 既存テストが引き続き PASS することを確認

`ProjectMetadata` のリファクタリング（共通ユーティリティ利用）後も既存テストが全て PASS すること。

---

## 後方互換性

- 既存の `client.projectMetadata` API は変更しない
- 既存の `GrdmProjectMetadataAttributes`, `GrdmRegisteredMeta` 等の型は変更しない
- 新機能は `client.draftProjectMetadata` として追加のみ

---

## セキュリティチェック

- [ ] ハードコードされたシークレットなし（API トークンは環境変数経由）
- [ ] ユーザー入力のバリデーション：nodeId / draftId は文字列として URL パスに埋め込むのみ
       （BaseResource が HTTP クライアントレベルで allowedHosts チェック済み）
- [ ] エラーメッセージに機密情報は含まない
