<script setup lang="ts">
useSeoMeta({
  title: '参加登録ヘルプ',
  description: 'Anabuki Eventの参加登録ヘルプ画面です。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card quiz-page">
      <header class="quiz-header">
        <p class="quiz-header-title">クイズ大会</p>
        <p class="eyebrow">
          Registration help
        </p>
      </header>
      <main class="page-shell">
        <div class="help-registration-body">
          <ul class="help-registration-list">
            <li>この画面はイベントへの参加登録画面です。</li>
            <li>表示名は100文字以内で入力してください。表示名は参加者の認証情報ではないため、他の参加者と同じ名前を使用できます。</li>
            <li>利用規約を確認し、同意チェックを入れると登録できます。</li>
            <li>アンケート（性別・年代・学生種別）は必須です。穴吹カレッジの学生は学校名と学科も選択してください。</li>
            <li>登録後はブラウザのCookieセッションで待機画面を表示します。</li>
          </ul>
        </div>
      </main>
    </section>
  </main>
</template>
