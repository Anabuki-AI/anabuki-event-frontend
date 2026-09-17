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

開発サーバーは通常 `http://localhost:3000` で起動します。Rails backend はデフォルトで `http://localhost:8080` を参照し、Nuxt のサーバールートが開発・本番ともに `/api` へのリクエストを転送します。本番起動時も `NUXT_BACKEND_BASE_URL` で転送先を指定できます。

## 管理者ログイン

`/admin` または `/admin/login` から利用できます。Google ログイン → 利用申請 → 管理者の承認 → 管理セッションへの切り替え、という既存 Rails API のフローに接続しています。承認済み・環境アクセスのアカウントは申請をスキップします。ログイン後は管理者メインへ進み、「権限付与」から利用申請の承認・却下を行えます。

- フロントエンドの `NUXT_PUBLIC_API_BASE` は `/api` のまま使用してください。Cookie 認証・OAuth コールバックを同一 origin に統一します。
- **バックエンド側**の `PUBLIC_BASE_URL` をフロントエンドの origin、`ADMIN_FRONTEND_URL` を `http://localhost:3000/admin`、`OPERATOR_FRONTEND_URL` を `http://localhost:3000/operator` に設定してください。callback は管理者用 `GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/google/callback` と、オペレーター用 `OPERATOR_GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3000/api/auth/operator/google/callback` を分離します。本番では対応する HTTPS URL に置き換えます。
- Google Cloud Console に両方の callback URL を完全一致で登録し、Google OAuth の client ID / secret はバックエンドだけに設定します。
- 最初の管理者はバックエンドの `ADMIN_EMAIL_ALLOWLIST` にメールアドレスを設定します。それ以外の初回利用者は、ログインから20分以内に申請・承認・切り替えが必要です。
- ログアウト・再ログインすると承認待ちの申請は取り消されます。承認後も申請時と同じ端末・ブラウザを利用してください。
- Google OAuth の中止や失敗は、Nuxt 経由の callback ならログイン画面のエラー案内に戻ります。バックエンドへ直接 callback する設定ではこの案内を経由しません。
- 管理機能は PC 向けです。ログイン導線は狭い画面でも崩れないよう設計しています。

調査内容・設計判断・検証方法は `.agent/admin-login-ui.md` に記録しています。

## 管理者コンソール

| URL | 内容 |
|---|---|
| `/admin` | 管理者メイン・アカウント・取得済み承認待ち件数 |
| `/admin/logs` | 操作内容・実行ユーザー・日時（監査ログAPI未連携） |
| `/admin/status` | Statuspage / Datadog の監視状態・手動のローカル疎通確認 |
| `/admin/permissions` | 実APIの管理アクセス一覧・利用申請の承認/却下 |
| `/admin/logout` | ログイン中のユーザーを表示し、確認後にログアウト |

すべての画面は既存セッション確認を経由し、未ログイン・申請者は `/admin/login` へ戻ります。PC中心のセージ系ワークスペースで、狭幅では横スクロールのメニューと1カラムに切り替わります。

**未連携の情報を正常値として表示しません。** 監査ログは「データ未連携」、管理者/運営ロールは「未連携」です。既存APIの `source` は付与方法であり、ロールとして扱いません。

外部監視は `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=false` が初期値です。バックエンドに `GET /api/admin/monitoring` の契約を実装してから `true` にしてください。詳細な型、未認証・権限不足・部分障害・更新時刻・鮮度の扱いは [監視連携契約](docs/admin-monitoring-contract.md) を参照してください。プロバイダーのAPIキーをフロント側に設定しないでください。

別枠の「疎通確認」は既存 Rails `/health` に Nuxt を経由して接続します。表示時間はブラウザからの単発往復時間で、Datadogのレイテンシ・全API稼働率・DB正常性ではありません。

画面マップ・API調査・ブランチの依存関係は `.agent/admin-console.md`、ブラウザ検証は `.agent/check-admin-console.mjs` に記録しています。

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

## Cloudflare Workers production deployment

Nuxt uses Nitro's `cloudflare_module` preset and produces `.output/server/index.mjs` plus `.output/public`. `wrangler.jsonc` explicitly maps the latter to the Cloudflare Workers Static Assets binding `ASSETS`; without this `assets.directory`, the Worker bundle is deployed but Nuxt's `_nuxt/*` JavaScript/CSS files are not uploaded. Nitro's generated Cloudflare handler calls `env.ASSETS.fetch()` for public asset paths, so the binding name must stay `ASSETS`.

The existing `server/api/[...path].ts` remains the single `/api/**` proxy. In Cloudflare it obtains `BACKEND` from Nitro's `event.context.cloudflare.env` and uses the Worker service binding; local development falls back to `NUXT_BACKEND_BASE_URL`/the existing dev proxy. Request `Origin` is preserved for Rails' exact same-origin check, client-controlled forwarded-protocol headers are replaced with the Worker request protocol, redirects remain manual, and h3's `getSetCookie()` path preserves multiple `Set-Cookie` values. The admin service-health endpoint uses the same binding and does not forward cookies or Origin.

`.github/workflows/ci.yml` runs lint, type-check, tests, and build for pull requests and `main` pushes. Production deployment runs only after `check` succeeds on a `main` push, or from `workflow_dispatch` selected on `main`; pull requests never deploy. The deploy job targets the GitHub `production` environment, uses a non-canceling deployment concurrency group, and compares `github.sha` with the current `origin/main` ref immediately before deployment so an older queued run is skipped instead of rolling back a newer main commit. The frontend `notify-parent` and `deploy-production` jobs intentionally both depend only on `check` and may run in parallel; parent gitlink synchronization is not a deployment prerequisite and keeps its own same-SHA guard. The deploy job validates only `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, uses read-only `contents` permission, and installs the pinned Wrangler version from `package.json`.

Deploy the backend Worker first on initial setup. The `BACKEND` service binding in `wrangler.jsonc` targets the Worker name `anabuki-event-backend`; that backend config disables its public `workers.dev` endpoint, leaving the service binding as the application path. The frontend's production `routes`/custom domain are intentionally **unset** because this change does not alter DNS. Add the approved fixed-domain route to this file only as a separately reviewed configuration change.

Local Cloudflare build validation (Node.js 22.19.0+):

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec wrangler deploy --dry-run --config wrangler.jsonc
```
