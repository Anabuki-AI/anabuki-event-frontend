# Anabuki Event Frontend

Anabuki Event のNuxtフロントエンドです。

## 技術スタック

- Nuxt 4
- Vue 3
- TypeScript
- pnpm
- ESLint
- Vitest

## 必要な環境

- Node.js 22.19.0以上
- pnpm 10.15.0

`.node-version` を利用できるNode.jsバージョン管理ツールを推奨します。

## セットアップ

```bash
pnpm install
cp .env.example .env
pnpm dev
```

開発サーバーは通常 `http://localhost:3000` で起動します。Javalin backendはデフォルトで `http://localhost:8080` を参照し、Nuxtの開発proxyが `/api` へのリクエストを転送します。

## 利用するbackend API

- ランキング画面: `GET /api/rankings`（上位10件）と `GET /api/rankings/users/{userId}`（自分の順位。参加登録時にlocalStorageへ保存したuserIdを利用）

## コマンド

```bash
pnpm dev        # 開発サーバー
pnpm lint       # ESLint
pnpm test       # Unit test
pnpm typecheck  # TypeScript / Vue type check
pnpm build      # Production build
```

## ディレクトリ方針

```text
app/
├─ components/        # 複数機能で共有するUI
├─ features/          # 機能固有のAPI・UI・型
├─ lib/api/           # 共通HTTP処理とエラー正規化
├─ pages/             # URLとページ組み立て
└─ assets/            # CSS等のビルド対象アセット
```

- `pages/` はルーティングとfeatureの組み立てを担当します。
- endpoint固有処理は `features/<feature>/api/` に置きます。
- 複数featureで共有するHTTP処理は `app/lib/api/` に置きます。
- 将来必要になるかもしれない空のfeatureや抽象層は先に作りません。
