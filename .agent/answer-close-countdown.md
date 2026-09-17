# 解答締め切りの10秒カウントダウン UI

- 日付: 2026-09-20
- ブランチ: `feat/answer-close-countdown`
- 基点: `origin/main` (`2fc5831`)

## 画面仕様

- 通常の「解答締め切り」操作は即時締め切りではなく、backend の `closing` phase を開始する。
- `QuizCloseCountdownBar.vue` を共有コンポーネントとして追加し、`phase=closing` とサーバーの `phase_started_at` から10秒の残り時間と上部プログレスバーを描画する。
- バーは参加者の `/users/answer` の最上部と、運営者の `/event_operator/quiz-control` の進行カード最上部に表示する。両画面ともローカル時計で1秒ごとに表示を更新するが、開始時刻はサーバー値のため同期する。
- `closing` 中、参加者は未送信なら解答フォームを維持し、送信済みなら送信済み画面を維持する。運営者はカウントダウン中と表示し、回答発表など次の進行操作は出さない。
- 既存の問題別 `time_limit_seconds` 満了は `immediate: true` を送る専用クライアント関数を通じ、従来どおり即時締め切りとする。

## API依存

backend は `closing` phase を返し、participant state にも `phase_started_at` を返す必要がある。バックグラウンドジョブが10秒後に `closed` へ遷移するため、運営者ブラウザを閉じても締め切りは完了する。

## 検証

Node 22.23.2 / pnpm 10.15.0 で実行:

```sh
pnpm test -- --run tests/unit/quiz-close-countdown-bar.test.ts tests/unit/quiz-control.test.ts tests/unit/operator-quiz-api-client.test.ts tests/unit/quiz-phase-panel.test.ts tests/unit/quiz-state.test.ts tests/unit/participant-quiz-answer-state.test.ts
pnpm typecheck
pnpm lint
```

結果: Vitest **43 files / 239 tests passed**、typecheck 成功、ESLint 成功。`git diff --check` も成功。
