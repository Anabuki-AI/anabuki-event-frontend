# 待機画面の参加人数ポーリング

`POST /api/participants/presence` は参加者Cookieを付けて呼び、`activeParticipantCount` を待機画面へ反映する。`observedAt` と `activeWindowSeconds` はAPI契約の型として保持し、表示要件がないためUIには出さない。

`useParticipantPresence` は可視時だけ20秒間隔で送信する。mount時および非表示から可視への復帰時は即時送信し、非表示・unmount時にはタイマーを停止する。同時送信を抑止し、失敗しても最後に成功した人数を変更しない。初回の未取得状態は `—` とし、既知の人数から増えた場合だけ既存のポップアニメーションを付ける。

待機画面のCSSはすでに `app/assets/css/main.css` の待機画面セクションとしてグローバル読込済みである。未参照かつ古い重複だった `waiting.css` は削除する。

## リアクション送信

リアクション押下ごとに `reportParticipantReaction` が参加者Cookie付きで `POST /api/participants/reactions`（API clientには `/participants/reactions` として指定）へ `{ reaction: '<emoji>' }` を送る。成功時のHTTP 201は共通API clientの通常の2xx成功として扱い、レスポンス本文は要求しない。

`setupWaitingRoom` は先に既存のローカルバウンドアニメーションを開始し、送信はfire-and-forgetで行う。送信失敗は意図的にUIへ表示せず握りつぶすため、アニメーションは失敗時も維持される。retriesやエラー表示は、送信箇所のcatch節を拡張して後から追加する。
