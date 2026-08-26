<script setup lang="ts">
const helpSections = [
  {
    title: 'クイズ大会について',
    content:
      'スマートフォンからクイズに参加し、回答結果に応じて順位を競うクイズ大会です。',
  },
  {
    title: '必要なもの',
    content:
      '参加にはスマートフォンが必要です。スマートフォンのみ対応しています。',
  },
  {
    title: '注意事項',
    content:
      '内容は現在調整中です。',
  },
  {
    title: '参加方法',
    content:
      '会場に掲示されているQRコード、または案内されたURLから参加できます。',
  },
  {
    title: '使い方',
    content:
      'クイズ画面から問題に回答できます。現在の順位はランキング画面から確認できます。',
  },
]

const faqItems = [
  {
    question: '回答を間違えて送信した場合、変更できますか？',
    answer:
      '制限時間内であれば変更できます。',
  },
  {
    question: 'スマートフォン以外でも参加できますか？',
    answer:
      '参加できません。スマートフォンのみ対応しています。',
  },
  {
    question: '通信が切れた場合はどうなりますか？',
    answer:
      '再接続できます。',
  },
  {
    question: '同点の場合はどうなりますか？',
    answer:
      '景品対象者が同点の場合は、じゃんけんで順位を決定します。',
  },
  {
    question: '景品は出ますか？',
    answer:
      '豪華景品を用意する予定です。景品対象となる順位は現在調整中です。',
  },
  {
    question: '途中参加はできますか？',
    answer:
      '途中参加できます。ただし、最初から参加している場合と比べて不利になる可能性があります。',
  },
  {
    question: 'Wi-Fiはありますか？',
    answer:
      '穴吹アリーナのWi-Fiを利用できます。ただし、利用者数によって回線が混雑する場合があります。',
  },
]

useSeoMeta({
  title: 'ヘルプ',
  description: 'Anabuki Eventのヘルプページです。',
})
</script>

<template>
  <main class="page-shell">
    <section class="form-card">
      <NuxtLink
        class="back-link"
        to="/"
      >
        ← ホームへ戻る
      </NuxtLink>

      <header>
        <p class="eyebrow">
          Help
        </p>

        <h1>ヘルプ</h1>

        <p class="muted-copy">
          クイズ大会への参加方法や注意事項を確認できます。
        </p>
      </header>

      <section aria-labelledby="help-guide-heading">
        <h2 id="help-guide-heading">
          ご利用案内
        </h2>

        <div class="help-list">
          <details
            v-for="section in helpSections"
            :key="section.title"
          >
            <summary>
              {{ section.title }}
            </summary>

            <p>
              {{ section.content }}
            </p>
          </details>
        </div>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading">
          よくある質問
        </h2>

        <div class="help-list">
          <details
            v-for="item in faqItems"
            :key="item.question"
          >
            <summary>
              {{ item.question }}
            </summary>

            <p>
              {{ item.answer }}
            </p>
          </details>
        </div>
      </section>

      <button
        type="button"
        disabled
      >
        アンケート回答はこちら
      </button>
    </section>
  </main>
</template>