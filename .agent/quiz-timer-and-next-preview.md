# クイズタイマー・次問題プレビューの引き継ぎ

- 日付: 2026-09-18
- ブランチ: feature/quiz-timer-and-next-preview
- 基準: origin/main ebed9d1（配点 PR #52 と operator PR #51 を含む）
- 作業場所: 親プロジェクト .worktree/feature-quiz-timer-and-next-preview-frontend

## 引き継いだ内容

Claude Code が frontend/main の未コミット状態で作成していたタイマー・次問題プレビューを分離した。配点の既マージ差分と開発サーバーの --host 変更は含めず、最新 main の画像ドラッグ&ドロップ対応を保持している。元の frontend/main 作業ファイルは変更していない（親 .agent/resume-claude-20260918/frontend-source-sha256.json で照合）。

- 問題作成・編集で任意の制限時間を設定。空欄は制限なし、1〜2147483647秒の整数。
- 運営出題画面で phase_started_at からの経過時間と残り時間を表示。受付中かつ0秒で既存close APIを1回実行。進行操作中は処理完了まで発火を保留。
- 次問は問題文・全選択肢・画像を表示し、正解は表示しない。次問なしの状態も表示。
- プレビューの本文/選択肢は16px、長文は折り返し、画像はcontainで表示。

## API依存

backend の対応 PR が必要。operator state の phase_started_at / current.time_limit_seconds / next_question、問題CRUDの timeLimitSeconds を使用する。送信は既存実装に合わせ time_limit_seconds を使用。自動締切は運営画面が開かれた状態でブラウザから実行する。バックエンド自体に期限強制のジョブを追加する仕様ではない。

## 検証

最終実行結果はPR本文および親 .agent/resume-claude-20260918/frontend-verification.md に記録する。新しいworktree用3002サーバーはsandbox内でbindできず、正規の権限要求がユーザーに拒否されたため起動を中止。既存3001の目視確認と最終worktreeの自動テストは別の検証として扱う。既存3000/3001および8080/8090のサーバーにはこの作業では変更を加えていない。
