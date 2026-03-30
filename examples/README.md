# Examples

このディレクトリには `grdm-api-typescript` の使い方を示すサンプルコードが含まれています。

## 前提条件

- Node.js 18 以上
- GakuNin RDM のパーソナルアクセストークン

トークンは GakuNin RDM の設定ページ（**Settings > Personal access tokens**）から発行できます。

## サンプル一覧

### [basic_usage.ts](./basic_usage.ts)

**認証ユーザーの情報取得・ノード一覧・プロジェクトメタデータ・ファイルメタデータの基本的な操作を一通り示すサンプルです。**

- 認証ユーザーのプロフィール取得 (`client.users.me()`)
- コントリビューターとして参加しているノードの一覧取得 (`client.nodes.listNodes()`)
- プロジェクトメタデータの取得 (`client.projectMetadata.listByNode()`)
- ファイルメタデータの取得 (`client.fileMetadata.getByProject()`)

```bash
GRDM_TOKEN=<your-token> npx ts-node examples/basic_usage.ts
```

---

### [file_metadata_via_proxy.ts](./file_metadata_via_proxy.ts)

**ブラウザフロントエンドで発生する CORS エラーを、リバースプロキシ経由で回避しながらファイルメタデータを取得するサンプルです。**

GRDM v1 API（`rdm.nii.ac.jp/api/v1`）はブラウザからの直接アクセスに CORS ヘッダを返さないため、フロントエンドからの呼び出しはブロックされます。
`GrdmClient` の `fetch` オプションにカスタム関数を渡すことで、リクエスト直前に URL を書き換え（プロキシ経路にリダイレクト）できます。
認証ヘッダはライブラリ側で自動付与されるため、カスタム関数は URL の置換のみを行います。

```ts
// カスタム fetch: v1 API の URL をローカルプロキシパスに書き換える
const grdmProxyFetch: typeof fetch = (input, init) => {
  const url = (typeof input === 'string' ? input : input.toString())
    .replace('https://rdm.nii.ac.jp/api/v1', '/grdm-v1-api');
  return fetch(url, init);
};

const client = new GrdmClient({
  token,
  v1BaseUrl: 'https://rdm.nii.ac.jp/api/v1',
  fetch: grdmProxyFetch,
});
```

プロキシ設定例（Next.js `next.config.js`）:

```js
rewrites: async () => [{
  source: '/grdm-v1-api/:path*',
  destination: 'https://rdm.nii.ac.jp/api/v1/:path*',
}]
```

```bash
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/file_metadata_via_proxy.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_NODE_ID` | ✅ | メタデータを取得するノード ID |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |
| `GRDM_V1_BASE_URL` | - | v1 API のベース URL（デフォルト: `https://rdm.nii.ac.jp/api/v1`） |
| `GRDM_PROXY_PREFIX` | - | 置換先のプロキシパス（デフォルト: `/grdm-v1-api`） |

---

### [fetch_grdm_file_metadata.ts](./fetch_grdm_file_metadata.ts)

**指定したノードの GakuNin RDM 独自ファイルメタデータを詳細に取得するサンプルです。**

スキーマ ID によるフィルタリングを行い、スキーマ①（公的資金）とスキーマ②（MS2 未病DB）それぞれのファイルメタデータを表示します。

- GRDM v1 API によるスキーマ①ファイルメタデータ（タイトル・データ種別・アクセス権・作成者など）の取得
  - ファイル種別（`grdm-file:file-type`）が `"manuscript"` の場合、原稿固有フィールド（`reviewed`・`manuscript-type` など）の追加表示
- GRDM v1 API によるスキーマ②ファイルメタデータ（計測対象・測定データ種別など）の取得

```typescript
// スキーマ ID でフィルタリングし、型アサーションでフィールドにアクセスする例
import { GrdmFileMetadataFields, SCHEMA_ID_PUBLIC_FUNDING } from 'grdm-api-typescript';

const activeSchema = file.items?.find((item) => item.active);
if (activeSchema?.schema === SCHEMA_ID_PUBLIC_FUNDING) {
  const data = activeSchema.data as GrdmFileMetadataFields;
  console.log(data['grdm-file:title-ja']?.value);
}
```

```bash
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch_grdm_file_metadata.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_NODE_ID` | ✅ | メタデータを取得するノード ID |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |

---

### [fetch_grdm_project_metadata.ts](./fetch_grdm_project_metadata.ts)

**指定したノードの GakuNin RDM 独自プロジェクトメタデータを詳細に取得するサンプルです。**

スキーマ ID によるフィルタリングを行い、スキーマ①（公的資金）とスキーマ②（MS2 未病DB）それぞれのファイルメタデータを表示します。

- GRDM v2 API によるプロジェクトメタデータ（研究課題名・資金提供者・課題番号など）の取得

```typescript
// スキーマ ID でフィルタリングし、型アサーションでフィールドにアクセスする例
import { GrdmFileMetadataFields, SCHEMA_ID_PUBLIC_FUNDING } from 'grdm-api-typescript';

const activeSchema = file.items?.find((item) => item.active);
if (activeSchema?.schema === SCHEMA_ID_PUBLIC_FUNDING) {
  const data = activeSchema.data as GrdmFileMetadataFields;
  console.log(data['grdm-file:title-ja']?.value);
}
```

```bash
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch_grdm_project_metadata.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_NODE_ID` | ✅ | メタデータを取得するノード ID |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |

---

### [file_operations.ts](./file_operations.ts)

**`GrdmClient` を使ったファイル操作を一通り示すサンプルです。**

- ストレージプロバイダの一覧取得 (`client.files.listProviders()`)
- ルートレベルのファイル一覧 (`client.files.listByNode()`)
- サブフォルダの内容取得（一括） (`client.grdmFiles.listByPath()`)
- サブフォルダの内容取得（ページネーション） (`client.grdmFiles.listByPathPaginated()`)
- ファイルのダウンロード (`client.files.download()`)
- 新規ファイルのアップロード → 更新 → 削除 (`client.files.uploadNew()` / `upload()` / `deleteFile()`)

```bash
GRDM_TOKEN=<your-token> npx ts-node examples/file_operations.ts [nodeId]
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |

`nodeId` を省略した場合は、認証ユーザーの最初のプロジェクトが自動的に選択されます。

---

### [nodes_management.ts](./nodes_management.ts)

**ノード（プロジェクト）の作成・取得・更新を示すサンプルです。**

> ⚠️ このサンプルはお使いのアカウントに実際のプロジェクトを作成します。

- プロジェクトの新規作成 (`client.nodes.create()`)
- プロジェクト情報の更新 (`client.nodes.update()`)
- プロジェクトの取得・確認 (`client.nodes.getById()`)

```bash
GRDM_TOKEN=<your-token> npx ts-node examples/nodes_management.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |

---

### [list_all_projects.ts](./list_all_projects.ts)

**ページネーションを使って、認証ユーザーがアクセスできる全プロジェクトを取得するサンプルです。**

`PaginatedResult` を活用した3つのページネーションアプローチを示しています。

| アプローチ | 方法 | 用途 |
|---|---|---|
| ページ単位で処理 | `for await (const page of result)` | バッチ処理・進捗の表示 |
| アイテム単位で処理 | `for await (const item of result.items())` | シンプルな全件処理 |
| 全件一括取得 | `await result.toArray()` | データ量が少ない場合 |

```bash
GRDM_TOKEN=<your-token> npx ts-node examples/list_all_projects.ts

# ページサイズを変更する場合
GRDM_TOKEN=<your-token> PAGE_SIZE=20 npx ts-node examples/list_all_projects.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |
| `PAGE_SIZE` | - | 1ページあたりの件数（デフォルト: `10`） |
