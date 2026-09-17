# admin/operator 申請ID型不一致の解消

## Findings

- `origin/main` を fetch 後、`ebed9d1`（`Merge pull request #51 from Anabuki-AI/operator`）から `fix/admin-operator-id-types` worktreeを作成した。
- 共有 `AccessRequest` はIDジェネリックを必須にし、`AdminAccessRequest = AccessRequest<number>` と `OperatorAccessRequest = AccessRequest<string>` を明示した。混在した `string | number` をAPI境界で暗黙に受け入れない。
- `adminAuthApi.decide` は数値IDのまま、`pendingOperatorRequests` / `decideOperatorRequest` は `OperatorAccessRequest` と `string` IDを使用する。UUID文字列は既存方針どおりエンコードせずURLへ補間する。
- `tests/unit/admin-auth-api.test.ts` は、admin IDが `number`、operator IDが `string` である型契約、および `42` と `550e8400-e29b-41d4-a716-446655440000` の実URLを検証する。
- 最新frontendでは `165646e`（`feat: split administrator and operator permissions`）でoperator申請の画面導線が削除され、`AdminConsole.vue` はoperator identityへの直接権限付与を使う。`useAdminPortal`、`useAdminConsoleData`、`AdminConsole.vue` にoperator申請props/fixtureは現在存在しないため、削除済みUIを再導入しなかった。現在の直接付与API `setOperatorAccess(id: string, ...)` は既にstring IDで型付け済みである。
- `app/admin/monitoring-contract.ts`、`app/admin/components/MonitoringPanel.vue`、`app/admin/composables/useAdminConsoleData.ts`、api-status/monitoring経路は未変更である。

## Relevant Files

- `app/lib/auth/access-request.ts` — IDジェネリック、admin/operator専用型alias
- `app/admin/types.ts` — adminの数値ID型aliasとoperator型のexport境界
- `app/operator/types.ts` — operator UUID文字列型のexport境界
- `app/admin/api/admin-auth.ts` — admin/operator申請APIの別戻り値・別ID型
- `tests/unit/admin-auth-api.test.ts` — API URLおよび型契約のテスト
- `backend/app/controllers/admin_operator_access_requests_controller.rb`（読み取り専用）— UUID形式を要求する`request_id!`
- `backend/db/operator_migrate/20260411000000_add_operator_access_request_flow.rb`（読み取り専用）— `operator_access_requests` のUUID主キー

## Migration / Investigation Notes

### 実行環境

- Node: `v22.19.0`（`mise exec node@22.19.0 pnpm@10.15.0`）
- pnpm: `10.15.0`
- 実行場所: `frontend/.worktree/fix/admin-operator-id-types`

### 再現可能な検証

| コマンド | 入力条件 / 実測 | 終了コード |
| --- | --- | --- |
| `git -C frontend fetch origin` | `origin/main` は `ebed9d1` | 0 |
| `git -C frontend worktree add .worktree/fix/admin-operator-id-types -b fix/admin-operator-id-types origin/main` | 新規worktreeと追跡ブランチを作成 | 0 |
| `mise exec node@22.19.0 pnpm@10.15.0 -- pnpm install --frozen-lockfile` | lockfile最新、764 packages、Nuxt types生成成功 | 0 |
| `mise exec node@22.19.0 pnpm@10.15.0 -- pnpm lint` | ESLintエラー0 | 0 |
| `mise exec node@22.19.0 pnpm@10.15.0 -- pnpm typecheck` | `nuxt typecheck`エラー0 | 0 |
| `mise exec node@22.19.0 pnpm@10.15.0 -- pnpm test` | 36 test files、210 tests passed、6.42 s | 0 |
| `git diff --check` | whitespaceエラーなし | 0 |

外部サービス、認証Cookie、実ユーザーデータ、backendサーバーへの実リクエストは実行していない。秘密情報は読み取り・記録していない。

## Recommended Next Steps

1. backendを起動できる安全な統合環境で、管理セッションを使ってUUID形式のoperator request IDのapprove/rejectをE2E確認する。現在のfrontend UIは直接権限付与を採用しており、operator申請endpointの画面導線を復活させるには要件確認が必要である。
2. operator申請導線を将来再導入する場合は、`OperatorAccessRequest[]`、`decideOperatorRequest(id: string, ...)`、およびadmin数値IDとのdiscriminated unionを使い、IDのunionをそのままadmin決定関数へ渡さない。
