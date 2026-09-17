# 管理者コンソール — 実装記録

## 要求と画面マップ

初回セージ系ログインのトーンを継承し、ログイン後を管理コンソールへ拡張する。既存の他画面はデザインの基準にしない。

```text
/admin/login  Googleログイン / 利用申請 / 承認待ち / 管理セッション交換
  └─ /admin  管理者メイン（実セッション、取得済み申請数、各機能への入口）
      ├─ /admin/logs         操作・実行ユーザー・日時（データ未連携）
      ├─ /admin/status       外部監視（Statuspage / Datadog）＋独立した手動疎通確認
      ├─ /admin/permissions  実APIの管理アクセス一覧＋既存申請の承認/却下
      └─ /admin/logout       ログイン中のユーザー＋確認してログアウト
```

`pages/admin/index.vue` と `pages/admin/[view].vue` は共通の `AdminPortal` を利用する。後者は許可された5種類のパラメータ以外を404にする。Vue Routerの alias は同一ルート扱いとなり画面間の遷移が抑制されるため使わない。未認証/申請者の直リンクは `/admin/login` へ戻り、参加者トップへの離脱は妨げない。

## Git base / PR #24との関係

- リポジトリ: `frontend`。親 `anabuki-event` にブランチ・コミットを作成していない。
- 作業開始時に `git fetch origin` 済み。取得した `origin/main`: `ea1ed83`。
- worktree: `frontend/.worktree/feat/admin-console`、branch: `feat/admin-console`。
- リモートmainにはログインUIがまだ存在しなかったため、ローカルmainの既存ログイン実装 `81b2ea2` と初回デザイン復元 `322e827` を前提にする。この2コミットはPRのmain差分にも含まれる。
- PR #24固有の `f2c372d`（Q&A削除）と `9e1db51`（表示ロジック分離）は取り込んでいない。ログインのQ&Aは元のまま。PR #24と独立にmainへ先にマージしないで、順序と競合を調整すること。
- 最初は前提2コミットをcherry-pickしたが、ツリーが `322e827` と完全一致することを確認し、未公開の作業ブランチのベースだけを元の共有コミットへ揃えた。作業ファイル・main・PR #24を変更せず、不要な重複コミットを残さない。

## API / モデル調査

調査対象のローカルbackend HEAD: `ee6037c`。`config/routes.rb`、`AdminAuth`、管理アクセス・セッション・health各controllerを確認。**Rails backendの変更は行っていない**。

| 用途 | 接続 |
|---|---|
| OAuth設定・開始・callback | 既存 `/api/auth/google/*` を維持 |
| セッション確認・交換・ログアウト | 既存 `/api/admin/auth/*` を維持 |
| 利用申請・申請確認 | 既存 `/api/admin/access-request` を維持 |
| 申請一覧・承認・却下 | 既存 `/api/admin/access-requests` と `/:id/approve`, `/:id/reject` |
| 管理アクセス一覧 | 実 `GET /api/admin/allowed-emails` |
| 単発のliveness確認 | frontend Nitro `GET /api/admin/service-health` → 既存公開 `GET /health` |
| 外部監視 | Rails `GET /api/admin/api-status`。対象環境のprovider設定と認証済みproxy経路を確認後にruntime flagで有効化。初期OFF |
| 監査ログ | 既存APIなし。データ未連携を明示 |
| 管理者 / 運営ロール変更 | 既存API・role属性なし。操作を有効にしない |

現行backendは `admin_enabled` とアクセス付与元を扱う。`ENVIRONMENT_ACCESS` / `MANAGEMENT_ACCESS` はロールではなく付与方法で、両者とも現行実装では管理権限を持つ。取消APIを運営ロールへの変更に読み替えることも禁止。全参加者の一覧と誤認しないよう一覧の範囲を明記する。

## 外部監視の拡張契約

詳細は `docs/admin-monitoring-contract.md`、型とruntime validationは `monitoring-contract.ts`。

- Statuspage / Datadogを独立したprovider cardで表示。取得先の一方が失敗しても他方を隠さない。
- transport 401（管理者ログイン切れ）と 403（有効な管理者の権限不足）を分離。provider/metricの `issue` はtransport認可と混同しない。
- provider取得状態（`available`/`partial`/`unconfigured`/`error`）とavailability状態を分離し、partialでも成功した指標を表示する。
- 指標の未設定・データなし・提供なし・取得失敗を区別する。`null`は0%や0 msへ変換しない。
- `updatedAt`、`windowLabel`、server `stale` はこのAPIにないため表示しない。provider `fetchedAt` とmetric `observedAt`（なければmetric `fetchedAt`）のみで5分の鮮度を判定し、日本時間で表示する。
- ローカル疎通の単発往復時間は、外部監視値や全APIの稼働率と混ぜない。
- `NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=false` が標準。OFF時はapi-status endpointへリクエストしない。
- 認証情報・外部サービス設定はbackend側の担当範囲。フロントへAPIキーを渡さない。

## デザイン / 責務

- セージの固定サイドバー、白いカード、静かなオフホワイト背景。主要タスクは中央の案内カード、実セッション情報、申請件数、3つの機能カードに整理。
- PC中心。800px以下で水平ナビ、560px以下で1カラム。ユーザー一覧はページ全体をはみ出させず、ラベル付き・キーボード操作可能なtable region内だけ横スクロール。
- `AdminPortal.vue`: 既存認証/申請の入口と管理コンソールへの分岐。
- `AdminConsole.vue`: レイアウト、画面の組み立て、承認確認、フォーカス。
- `MonitoringPanel.vue`: providerごとの監視表示と鮮度。
- `console-presentation.ts`: URL、ナビゲーション、コピー、日時、付与方法の表示。
- `api/admin-console.ts`: API境界と管理アクセス型。
- `useAdminConsoleData.ts`: リソース別のloading/error/data状態、二重取得防止、unmount後の更新防止。
- `monitoring-contract.ts`: 監視型、状態ラベル、schema validation、鮮度判定。
- `styles/admin-console.css`: コンソールに限定したCSS。既存一般ユーザー画面へ漏れない。
- 申請確認はnative dialog。描画後に開き、取消側へ初期フォーカス、Tab循環、Escape取消、起点への復帰。申請処理後は見出しへフォーカスを戻す。
- ログアウトは専用確認画面。APIに表示名がないためメールアドレスをユーザー識別として使い、その理由を明記。

## 検証

- `pnpm lint` / `pnpm typecheck` / `pnpm test`（55 tests）/ `pnpm build` / `git diff --check`。
- SFCの表示テストのため `@vitejs/plugin-vue` をdevDependencyとして明示し、Vitestへ登録。
- Chromium: 1440 / 390 / 320 / 768 / 1024px。5画面すべてでページ横はみ出しなし。
- axe WCAG 2 A/AA・2.1 AA: **38画面/状態、違反0件**。機能フロー1件を合わせ39 checks、runtime error 0。
- 直リンク、メニュー遷移、ブラウザ戻る、skip link、承認の確認前にPOSTしないこと、dialogのTab/Escape、申請一覧の更新失敗/再試行、承認権限なし、ログアウト前確認、ログイン/申請/承認後交換を検証。
- 未設定・provider認証失敗・provider権限不足・取得失敗・部分障害・古い正常値・monitoring API403/503をブラウザ確認。
- 実Railsへのlocal health probeの成功と、通信失敗後に以前の成功が消えることを確認。
- スクリーンショットのアカウント/申請は明示的な合成fixture（`example.test`）。部分障害画像もテストfixtureであり、実際の障害報告ではない。プロダクションにfixtureデータやdemoモードを埋め込んでいない。
- スクリーンショット: `docs/screenshots/admin-console/`（5画面PC/モバイル＋部分障害fixture）。
- 結果: `.agent/admin-console-browser-results.json`。再実行: `.agent/check-admin-console.mjs`。

### ブラウザ検証の再現

```sh
npm install --prefix .agent/browser-tools --no-save playwright axe-core
.agent/browser-tools/node_modules/.bin/playwright install chromium
# 端末1: 標準設定の開発UI
NUXT_BACKEND_BASE_URL=http://127.0.0.1:8080 pnpm dev --host 127.0.0.1 --port 3002
# 端末2: 監視有効時の契約UXテスト用production server
pnpm build
NUXT_BACKEND_BASE_URL=http://127.0.0.1:8080 NUXT_PUBLIC_ADMIN_MONITORING_ENABLED=true PORT=3003 HOST=127.0.0.1 node .output/server/index.mjs
# 端末3
node .agent/check-admin-console.mjs
```

2つのNuxt dev serverを同じworktreeから立ち上げるとロックされるため、監視有効のfixture検証にはproduction serverを使用する。開発ログ・一時tool installは `.agent/.gitignore` で除外。

## 外部依存 / ローカル起動

- 実GoogleアカウントのOAuth往復、実ユーザーの承認/権限変更はこの作業では実行していない。既存APIの契約とモックを使って破壊的操作なしで検証。
- Statuspage/Datadogの実データはTerra担当のbackend契約実装・権限設計・サーバー設定待ち。監査ログ・role変更もbackend API待ち。
- 既存のOAuth callbackとOrigin許可設定に合わせ、実操作の確認URLは **http://localhost:3000/admin** を使用する。3002/3003はUI検証用で、実バックエンドのOrigin制限を変更していない。
- `.env`、OAuthシークレット、メールallowlist、Google Cloud Consoleの設定は一切変更していない。
