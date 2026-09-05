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
    <NuxtLink
      class="help-back-link"
      to="/"
    >
      ← ホームへ戻る
    </NuxtLink>

    <section class="help-intro">
      <p class="help-eyebrow">
        Help
      </p>

      <h1 class="help-title">
        ヘルプ
      </h1>

      <p class="help-intro-content">
        クイズ大会への参加方法や注意事項を確認できます。
      </p>
    </section>

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
  </main>
</template>