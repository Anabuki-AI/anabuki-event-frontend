# 参加者クイズ UI: 状態契約とポーリング仕様

## API と認証

- 状態取得は participant cookie を送る `GET /api/participant/quiz/state`、解答送信は同じ cookie を送る `POST /api/participant/quiz/answers` を使う。
- 共通の `~/lib/api/client` を経由し、`credentials: 'include'` と `retry: 0` を明示する。ブラウザからは相対 `/api` に送るため、既存のNuxt proxy・同一Origin規約（POST の Origin 検査）を満たす。CSRFトークンを追加する独自規約は既存クライアントにない。
- 401 は参加登録 `/participants/new` へ遷移する。送信時の409は画面操作を止め、状態を再取得して、締切・重複回答・正答発表のいずれかの最新状態へ同期する。

## state の表示契約

- `{ event: null, question: null }`、`question: null`、`PENDING` は待機画面の状態。`/users/answer` で受け取った場合は `/participants/waiting` に戻す。イベントstatusの終了値はバックエンドと同じ `FINISHED` を使う。
- 待機画面が `PUBLISHED` / `CLOSED` / `REVEALED` を受け取ったら `/users/answer` に移動する。ただし `FINISHED` は問題statusより優先し、待機画面・解答画面とも「クイズ大会は終了しました」を表示して遷移しない。
- `PUBLISHED` かつ `myAnswer` が無い場合だけ解答フォームを表示する。回答済みの `PUBLISHED` と `CLOSED` は正答発表待ち。
- `REVEALED` だけが `correctAnswer`、`myAnswer.isCorrect`、`myAnswer.points`、`event.totalScore` を表示できる。APIが返さない公開前の正答・得点をフロントで補完・計算しない。
- 自信度の倍率は `event.confidenceMultipliers` の文字列値をそのまま表示し、固定のダミー得点は持たない。

## ポーリング

`use-participant-quiz-state.ts` の `createParticipantQuizPoller` が両ページで共通に使う規約です。

1. mounted 後、可視タブなら即時に1回取得する。
2. 可視タブの間だけ `5,000ms` 間隔で取得する。同じリクエストが未完了なら次のtickは送らない。
3. `document.visibilityState !== 'visible'` への遷移時には interval 自体を停止する。可視に復帰したら即時取得して interval を再開する。
4. unmount 時に interval と `visibilitychange` listener を必ず解除する。
