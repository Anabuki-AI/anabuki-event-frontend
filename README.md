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

## 管理者認証UI

管理者ページはGoogle OAuth後のサーバー判定（A:申請者 / B:管理ページ利用者 / C:環境設定者）だけを表示します。申請者の承認ポーリングと一回限りexchange、承認待ち一覧、利用許可の解除を提供します。Aの申請がセッション失効・ログアウトでCANCELLEDになった場合は、承認待ち表示を止めて再ログインを案内します。B/Cの一覧はサーバー側で有効なPENDINGだけを受け取り、期限切れ・取消済みは表示しません。端末ID、Cookie値、ハッシュ、セッション行は型/API/UIへ公開せず、端末一覧も表示しません。
