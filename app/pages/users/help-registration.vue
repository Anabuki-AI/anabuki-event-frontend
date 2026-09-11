<script setup lang="ts">
useSeoMeta({
  title: 'ユーザー登録ヘルプ',
  description: 'Anabuki Eventのユーザー登録ヘルプ画面です。',
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
            <li>ニックネームは3〜20文字で入力してください。登録済みの名前や不適切な言葉は使用できません。</li>
            <li>利用規約を確認し、同意チェックを入れると登録できます。</li>
            <li>アンケート(性別・年代・学生種別)は必須です。穴吹カレッジの学生は学校名と学科も選択してください。</li>
            <li>登録が完了すると待機画面に移動します。</li>
          </ul>
        </div>
      </main>
    </section>
  </main>
</template>
