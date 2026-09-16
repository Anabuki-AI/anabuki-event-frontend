<script setup lang="ts">
useSeoMeta({
  title: '参加登録・待機画面ヘルプ',
  description: 'Anabuki Eventの参加登録と待機画面のヘルプです。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card waiting-card quiz-page">
      <header class="quiz-header">
        <p class="quiz-header-title">クイズ大会</p>
        <p class="eyebrow-main">
          ヘルプ
        </p>
      </header>

      <div class="help-screen-body">
        <h1>参加登録</h1>
        <ul class="help-screen-list">
          <li>表示名は100文字以内で入力してください。表示名は参加者の認証情報ではないため、他の参加者と同じ名前を使用できます。</li>
          <li>利用規約を確認し、同意チェックを入れると登録できます。</li>
          <li>アンケート（性別・年代・学生種別）は必須です。穴吹カレッジの学生は学校名と学科も選択してください。</li>
          <li>登録後はブラウザのCookieセッションで待機画面を表示します。</li>
        </ul>

        <h2>待機画面</h2>
        <ul class="help-screen-list">
          <li>参加人数は自動で更新されます。</li>
          <li>リアクションボタンで気持ちを伝えられます。</li>
          <li>クイズが開始されると、画面が自動的に切り替わります。</li>
        </ul>
      </div>

      <NuxtLink class="primary-link" to="/participants/waiting">
        待機画面へ戻る
      </NuxtLink>
    </section>
  </main>
</template>
