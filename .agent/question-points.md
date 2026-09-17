# 問題ごとの配点（points）入力UI追加

ブランチ: `feat/question-points`（worktree: `anabuki-event/.worktree/feat-question-points-frontend`）
対応するバックエンドPR: `anabuki-event-backend-rails` の `feat/question-points` ブランチ（`questions.points` カラム追加・API対応）。

## 対応画面

`event_operator/management.vue`（問題管理、イベント開催者向け・PC/タブレット対応）から開く以下2つのモーダル:

- `app/pages/event_operator/question-add.vue`（問題追加）
- `app/pages/event_operator/questione.vue`（問題編集）

いずれも `question-add-shell` 系の共通クラス名（`question-add.css` / `questionedit2.css`、内容は同一）を使うモーダルダイアログ。

## 実装内容

- `app/features/problems/types.ts`: `Question.points: number` を追加（APIレスポンスの `points` フィールドに対応）
- `app/features/problems/constants.ts`: `QUESTION_POINTS_MIN = 1` / `QUESTION_POINTS_MAX = 1000` / `QUESTION_POINTS_DEFAULT = 100` を追加（バックエンドの `Question::MIN_POINTS` / `MAX_POINTS` / DBデフォルト100と一致させる）
- `app/features/problems/validation.ts`: `validatePointsInput(value, min, max)` を追加（既存の `validateMultiplierInput` に倣ったスタイル。空欄・非整数・範囲外を弾く）
- `app/features/problems/api/client.ts`: `QuestionPayload.points: number` を追加し、`toFormData` で `points` をmultipart送信するように対応
- `question-add.vue` / `questione.vue`:
  - フォームに「配点」入力欄（`type="number"`, 1〜1000の整数, 追加画面は初期値100）を、問題文の直後・画像アップロードの前に追加
  - `canSave` の算出条件に `validatePointsInput(...) === ''` を追加（既存フィールドと同じく、保存ボタンの活性/非活性でバリデーションを表現する既存UXパターンに合わせた。個別のエラーバナーは出さず、補足テキスト（12px、`.question-add-hint`）で入力条件を案内）
  - 送信時に `points: Number(form.points)` をpayloadへ
- `management.vue` / `management.css`: 問題一覧の各行サマリーに配点バッジ（`配点 N点`）を追加。既存の正解バッジ（`.correct-badge`）と並べて表示。配色はメインカラー `#1769c2` / 背景 `#edeffa`（プロジェクトのカラーガイドに準拠）
- `QuestionPreviewModal.vue`（プレビュー機能）: 「獲得できる予定のポイント」の基礎点計算を、これまでのハードコードされた100点から `props.question.points`（実際にその問題へ設定された配点）を使う計算に変更。配点を編集可能にした以上、プレビューが古い固定値のままだと運営者に誤った情報を見せてしまうための修正（自信度倍率のラベル自体は既存のダミー値 ×1.5/×1.0/×0.5 のまま維持。実際の自信度倍率設定とは連動していない既存仕様で、今回のスコープ外）

## スコープ外にしたこと（要ユーザー判断）

実際の採点処理（参加者の獲得点数計算）は、バックエンドの `ParticipantAnswer::BASE_SCORE = 100` 固定値を使うロジックのままで、今回の配点フィールドはまだ反映されていません。理由・詳細はバックエンド側 `.agent/question-points.md` を参照してください。大会本番の採点結果に関わる変更のため、独断でロジックを変えず、フォローアップ課題として明記しています。

## テスト

- `pnpm test`（vitest）: 34ファイル / 206件成功（新規: `validatePointsInput` のテストを `question-validation.test.ts` に追加、既存の `Question` フィクスチャ・`QuestionPayload` フィクスチャに `points` を追加して型を合わせた）
- `pnpm run typecheck`（`nuxt typecheck`）: エラーなし
- `pnpm exec eslint <変更ファイル>`: 指摘なし
