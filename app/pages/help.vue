<script setup lang="ts">
import { computed } from 'vue'
import {
  faqItems,
  helpSections,
  operationGuideItems,
} from '~/features/help/data/help-content'

const route = useRoute()

const activeGuideId = computed(() => {
  return route.hash.replace('#', '')
})

const router = useRouter()

function returnToPreviousPage() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/')
}

useSeoMeta({
  title: 'ヘルプ',
  description: 'Anabuki Eventのヘルプページです。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card help-card">
      <button
        type="button"
        class="back-link help-back-button"
        @click="returnToPreviousPage"
      >
        ← 前の画面へ戻る
      </button>

      <div class="help-heading">
        <p class="help-event-title">
          クイズ大会
        </p>

        <p class="eyebrow">
          HELP
        </p>

        <h1>ヘルプ</h1>

        <p class="muted-copy">
          各画面の操作方法や注意事項を確認できます。
        </p>
      </div>

      <section
        class="help-section"
        aria-labelledby="guide-heading"
      >
        <h2
          id="guide-heading"
          class="help-section-title"
        >
          操作方法
        </h2>

        <div class="help-list">
          <section
            v-for="item in operationGuideItems"
            :id="item.id"
            :key="item.id"
            class="help-operation-item"
            :class="{ 'is-active': activeGuideId === item.id }"
          >
            <h3 class="help-operation-title">
              {{ item.title }}
            </h3>

            <p
              v-if="item.description"
              class="help-operation-description"
            >
              {{ item.description }}
            </p>

            <a
              v-if="item.manualHref"
              class="help-operation-link"
              :href="item.manualHref"
              target="_blank"
              rel="noopener noreferrer"
            >
              操作マニュアルを見る
            </a>
          </section>
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
          ヘルプ
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

        <div class="help-list help-faq-list">
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
    </section>
  </main>
</template>
