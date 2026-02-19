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

### [fetch_project_and_file_metadata.ts](./fetch_project_and_file_metadata.ts)

**指定したノードのプロジェクトメタデータとファイルメタデータを詳細に取得するサンプルです。**

- GRDM v2 API によるプロジェクトメタデータ（研究課題名・資金提供者・課題番号など）の取得
- GRDM v1 API によるファイルメタデータ（タイトル・データ種別・アクセス権・作成者など）の取得

```bash
GRDM_TOKEN=<your-token> GRDM_NODE_ID=<node-id> npx ts-node examples/fetch_project_and_file_metadata.ts
```

| 環境変数 | 必須 | 説明 |
|---|---|---|
| `GRDM_TOKEN` | ✅ | パーソナルアクセストークン |
| `GRDM_NODE_ID` | ✅ | メタデータを取得するノード ID |
| `GRDM_BASE_URL` | - | v2 API のベース URL（デフォルト: `https://api.rdm.nii.ac.jp/v2/`） |

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
