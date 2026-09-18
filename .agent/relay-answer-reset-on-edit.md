# 通常問題から中継問題へ編集したときの正解リセット

- ブランチ: `fix/relay-answer-reset-on-edit`
- 対象: `QuestionEditModal.vue`
- 通常問題を「中継問題として扱う」に切り替えたとき、旧 `correctAnswer` をフォーム上で未選択に戻す。
- 保存時に未確定の中継問題はDB必須値のプレースホルダ `A` を送信する。バックエンド側でも旧正解を正規化する。
- 回帰テスト: `tests/unit/question-relay-selection.test.ts`

## 検証

- `pnpm test -- --run tests/unit/question-relay-selection.test.ts tests/unit/question-saved-emit.test.ts`
- `pnpm typecheck`
- `pnpm lint`
