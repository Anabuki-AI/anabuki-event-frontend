<script setup lang="ts">
useSeoMeta({
  title: 'ホーム',
  description: '全員で競うリアルタイムクイズイベント。参加登録してランキング上位を目指そう。',
})
</script>

<template>
  <main class="page-shell home-shell">
    <section class="home-hero">
      <span
        class="home-hero-mark home-hero-mark-left"
        aria-hidden="true"
      >?</span>
      <span
        class="home-hero-mark home-hero-mark-right"
        aria-hidden="true"
      >?</span>

      <p class="home-eyebrow">
        Anabuki Event
      </p>
      <h1 class="home-title">
        クイズで、<br>競おう。
      </h1>
      <p class="home-copy">
        その場で出題されるクイズにみんなで挑戦。
        正解と速さがランキングに直結する、リアルタイム対戦イベントです。
      </p>
      <div class="home-actions">
        <NuxtLink
          class="home-primary-link"
          to="/participants/new"
        >
          参加登録をはじめる
        </NuxtLink>
        <NuxtLink
          class="home-secondary-link"
          to="/rankings"
        >
          ランキングを見る
        </NuxtLink>
      </div>
    </section>

    <section
      class="home-steps"
      aria-label="参加の流れ"
    >
      <article class="home-step">
        <span class="home-step-number">1</span>
        <h2 class="home-step-title">
          参加登録
        </h2>
        <p class="home-step-copy">
          表示名と基本情報を入力して参加登録。1分で完了します。
        </p>
      </article>
      <article class="home-step">
        <span class="home-step-number">2</span>
        <h2 class="home-step-title">
          クイズに挑戦
        </h2>
        <p class="home-step-copy">
          出題にあわせてリアルタイムで回答。早く正解するほど高得点。
        </p>
      </article>
      <article class="home-step">
        <span class="home-step-number">3</span>
        <h2 class="home-step-title">
          ランキング確認
        </h2>
        <p class="home-step-copy">
          得点と順位をリアルタイムでチェック。上位を目指そう。
        </p>
      </article>
    </section>

    <p class="home-footer-link">
      <NuxtLink to="/operator">イベントオペレーターの方はこちら</NuxtLink>
    </p>
  </main>
</template>
