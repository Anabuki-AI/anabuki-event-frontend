<script setup lang="ts">
import {
  faqItems,
  helpSections,
} from '~/features/help/data/help-content'

useSeoMeta({
  title: 'ヘルプ',
  description: 'Anabuki Eventのヘルプページです。',
})
</script>

<template>
  <main class="help-page">
    <article class="help-card">
      <NuxtLink
        class="help-back-link"
        to="/"
      >
        ← ホームへ戻る
      </NuxtLink>

      <header class="help-header">
        <p class="help-eyebrow">
          Help
        </p>

        <h1 class="help-title">
          ヘルプ
        </h1>

        <p class="help-description">
          クイズ大会への参加方法や注意事項を確認できます。
        </p>
      </header>

      <section
        class="help-section"
        aria-labelledby="guide-heading"
      >
        <h2
          id="guide-heading"
          class="help-section-title"
        >
          ご利用案内
        </h2>

        <div class="help-list">
          <details
            v-for="section in helpSections"
            :key="section.title"
            class="help-item"
          >
            <summary class="help-item-summary">
              {{ section.title }}
            </summary>

            <p class="help-item-content">
              {{ section.content }}
            </p>
          </details>
        </div>
      </section>

      <section
        class="help-section"
        aria-labelledby="faq-heading"
      >
        <h2
          id="faq-heading"
          class="help-section-title"
        >
          よくある質問
        </h2>

        <div class="help-list">
          <details
            v-for="item in faqItems"
            :key="item.question"
            class="help-item"
          >
            <summary class="help-item-summary">
              {{ item.question }}
            </summary>

            <p class="help-item-content">
              {{ item.answer }}
            </p>
          </details>
        </div>
      </section>
    </article>
  </main>
</template>

<style scoped>
.help-page {
  --help-primary: #1769c2;
  --help-background: #edeffa;
  --help-surface: #ffffff;
  --help-text: #132238;
  --help-muted-text: #516176;
  --help-border: rgb(19 34 56 / 12%);

  min-height: 100vh;
  padding: 24px 16px 40px;
  color: var(--help-text);
  background: var(--help-background);
}

.help-card {
  width: min(100%, 480px);
  margin: 0 auto;
  padding: 24px 18px 32px;
  border-radius: 20px;
  background: var(--help-surface);
}

.help-back-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-bottom: 16px;
  color: var(--help-muted-text);
  font-size: 14px;
  text-decoration: none;
}

.help-header {
  margin-bottom: 32px;
}

.help-eyebrow {
  margin: 0 0 8px;
  color: var(--help-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.help-title {
  margin: 0;
  font-size: 32px;
  line-height: 1.3;
}

.help-description {
  margin: 12px 0 0;
  color: var(--help-muted-text);
  font-size: 16px;
  line-height: 1.7;
}

.help-section + .help-section {
  margin-top: 32px;
}

.help-section-title {
  margin: 0 0 12px;
  font-size: 20px;
  line-height: 1.4;
}

.help-list {
  display: grid;
  gap: 12px;
}

.help-item {
  overflow: hidden;
  border: 1px solid var(--help-border);
  border-radius: 14px;
  background: var(--help-surface);
}

.help-item-summary {
  position: relative;
  padding: 16px 48px 16px 16px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  list-style: none;
  cursor: pointer;
}

.help-item-summary::-webkit-details-marker {
  display: none;
}

.help-item-summary::after {
  position: absolute;
  top: 50%;
  right: 16px;
  content: '+';
  color: var(--help-primary);
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  transform: translateY(-50%);
}

.help-item[open] .help-item-summary::after {
  content: '−';
}

.help-item-content {
  margin: 0 16px;
  padding: 16px 0;
  border-top: 1px solid var(--help-border);
  font-size: 16px;
  line-height: 1.7;
}

.help-item[open] .help-item-summary {
  color: var(--help-primary);
}

.help-item-summary:active {
  background: var(--help-background);
}

</style>
