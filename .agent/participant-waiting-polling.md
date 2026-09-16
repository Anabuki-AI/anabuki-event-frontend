# 待機画面の参加人数ポーリング

`POST /api/participants/presence` は参加者Cookieを付けて呼び、`activeParticipantCount` を待機画面へ反映する。`observedAt` と `activeWindowSeconds` はAPI契約の型として保持し、表示要件がないためUIには出さない。

`useParticipantPresence` は可視時だけ20秒間隔で送信する。mount時および非表示から可視への復帰時は即時送信し、非表示・unmount時にはタイマーを停止する。同時送信を抑止し、失敗しても最後に成功した人数を変更しない。初回の未取得状態は `—` とし、既知の人数から増えた場合だけ既存のポップアニメーションを付ける。

待機画面のCSSはすでに `app/assets/css/main.css` の待機画面セクションとしてグローバル読込済みである。未参照かつ古い重複だった `waiting.css` は削除する。
