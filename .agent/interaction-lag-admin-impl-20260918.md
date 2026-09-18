# admin 横断操作ラグ解消 実装記録

- 実施日: 2026-09-18
- リポジトリ: `frontend`
- 作業ブランチ: `feat/admin-row-pending`
- 起点: `origin/main` / `ab71f301f6b72d2da5cc66d7cca43e6e9e51cdca`
- 対象: Recommended 4-5（admin 行単位 pending、accounts refresh 保持、voting-rate stale 保持、button pressed feedback）
- 対象外: `quiz-control`、`management`、`useAsyncAction` 共通 composable、新規楽観権限反転

## 実装

### Admin

- `app/admin/composables/useAdminPortal.ts`
  - `decidingRequestId: Ref<number | null>` を追加。
  - access decision の API 応答前は pending request を保持し、成功後だけ filter と success notice を更新。
  - 409/error 時は既存の request 行保持と recovery message を維持。
  - decision の pending は portal 全体の `busy` と分離。
- `app/admin/components/AdminPortal.vue`
  - `decidingRequestId` を `AdminConsole` へ渡す。
- `app/admin/components/AdminConsole.vue`
  - request 行へ `aria-busy`、`row-pending`、対象行だけの disabled、`承認中…`/`却下中…` を追加。
  - operator 行へ `changingOperatorId` に基づく row pending、対象 button の disabled/変更中表示を追加。
  - request 確定後の accounts 再取得を refresh mode (`loadAccounts(true)`) に変更。
- `app/admin/composables/useAdminConsoleData.ts`
  - 初回ロード (`accountsLoading`) と再検証 (`accountsRefreshing`) を分離。
  - refresh 中は既存 `accounts` と `accountsLoaded` を保持。一般的な GET 失敗でも stale 一覧を残す。
  - 401/403 は権限・セッション喪失のため一覧をクリアして既存の session recovery を実行。
  - `changingOperatorId` を追加し、PATCH 応答後のみ operator account object/badge を置換。

### Voting rate

- `app/features/voting-rate/use-voting-rate.ts`
  - 成功取得時の `lastUpdatedAt` を保存。
  - 手動 refresh の失敗時は questions/summary/bar/旧時刻を変更せず、error のみ更新。
- `app/pages/event_operator/voting-rate.vue`
  - stale 値を表示したまま inline error と `再試行` button を表示。
  - 最終取得時刻と「保存済みの値を表示中」を表示。
- `app/assets/css/voting-rate.css`
  - inline error/retry と stale timestamp のレイアウトを追加。

### Global pressed feedback

- `app/assets/css/main.css`
  - `button:not(:disabled):active { transform: scale(.98); }` を global button rule 近傍へ追加。
  - link、disabled button、非 button には適用しない。
  - reaction button の既存 `.94` は通常時の詳細 selector を維持し、`prefers-reduced-motion: reduce` 時は active transform を `none` にする。

## テスト追加・変更

- `tests/unit/admin-portal.test.ts`
  - decision 中に対象 request の ID が pending、行が応答前に保持、成功後のみ filter されること。
- `tests/unit/admin-console-data.test.ts`
  - account refresh 失敗時に既存一覧と `accountsLoaded` を保持すること。
  - operator identity PATCH 中に `changingOperatorId` を保持し、他行を配列から消さないこと。
- `tests/unit/admin-permissions-screen.test.ts`
  - request/operator の row-specific pending/ARIA copy 契約。
- `tests/unit/voting-rate-api.test.ts`
  - 手動 refresh 失敗時に旧 summary と `lastUpdatedAt` を保持すること。

## 検証

| コマンド | 結果 |
|---|---:|
| `git diff --check` | exit 0 |
| `pnpm lint`（Node `v22.23.2` / pnpm `10.15.0`） | exit 0 |
| `pnpm typecheck`（Node `v22.23.2` / pnpm `10.15.0`） | exit 0 |
| `pnpm test`（Node `v22.23.2` / pnpm `10.15.0`） | exit 0、48 files / 284 tests passed |
| `pnpm build`（Node `v22.23.2` / pnpm `10.15.0`） | exit 0、Nuxt 4.5.2 client/server/Cloudflare build complete |

初期環境の既定 `node` は v20.17.0 だったため、Node 20 での lint/typecheck/prepare は engine/native optional dependency の都合で失敗した。プロジェクト要件の Node 22.19+ (`C:\Users\yuzum\AppData\Local\pi-node\current\node.exe`, v22.23.2) を明示して上表を再実行し、全て exit 0 を確認した。

## 未確認事項

- 認証済み staging/production API に対する実 POST/PATCH、409 の live 挙動、複数 operator 同時操作は未実行。
- 実ブラウザの screenshot/Performance trace、Android/iPhone/PC の目視確認は未実施。
- CI の GitHub Actions 実行結果は PR 作成後に確認する。
- PR 番号と merge commit hash は PR 作成・CI・admin merge 後に最終報告へ記載する。
