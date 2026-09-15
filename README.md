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

`/admin` または `/admin/login` から利用できます。Google ログイン → 利用申請 → 管理者の承認 → 管理セッションへの切り替え、という既存 Rails API のフローに接続しています。承認済み・環境アクセスのアカウントは申請をスキップします。ログイン後は管理ポータルに申請承認用の受信箱が表示されます。

- フロントエンドの `NUXT_PUBLIC_API_BASE` は `/api` のまま使用してください。Cookie 認証・OAuth コールバックを同一 origin に統一します。
- **バックエンド側**の `PUBLIC_BASE_URL` をフロントエンドの origin、`ADMIN_FRONTEND_URL` を `http://localhost:3000/admin`、`GOOGLE_OAUTH_CALLBACK_URL` を `http://localhost:3000/api/auth/google/callback` に設定してください。本番では対応する HTTPS URL に置き換えます。
- Google Cloud Console に上記 callback URL を完全一致で登録し、Google OAuth の client ID / secret はバックエンドだけに設定します。
- 最初の管理者はバックエンドの `ADMIN_EMAIL_ALLOWLIST` にメールアドレスを設定します。それ以外の初回利用者は、ログインから20分以内に申請・承認・切り替えが必要です。
- ログアウト・再ログインすると承認待ちの申請は取り消されます。承認後も申請時と同じ端末・ブラウザを利用してください。
- Google OAuth の中止や失敗は、Nuxt 経由の callback ならログイン画面のエラー案内に戻ります。バックエンドへ直接 callback する設定ではこの案内を経由しません。
- 管理機能は PC 向けです。ログイン導線は狭い画面でも崩れないよう設計しています。

調査内容・設計判断・検証方法は `.agent/admin-login-ui.md` に記録しています。

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
