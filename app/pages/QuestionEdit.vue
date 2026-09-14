<script setup lang="ts">
import { ref } from 'vue'
import { useSeoMeta } from '#imports'
import QuestionPopup from './event_operator/questione.vue'

useSeoMeta({
  title: '問題編集',
  description: 'Anabuki Eventの問題編集画面です。',
})

// モーダル表示フラグと表示中の問題番号の状態管理
const isEditOpen = ref(false)
const currentQuestionIndex = ref(1)

function openEdit() {
  isEditOpen.value = true
}

function closeEdit() {
  isEditOpen.value = false
}
</script>

<template>
  <section class="form-card quiz-page">
    <header class="question-header">
      <!-- 編集モーダルを開くボタン -->
      <button
        type="button"
        class="question-add-button"
        @click="openEdit"
      >
        編集する
      </button>
    </header>

    <!-- モーダル表示部（isEditOpen が true の時だけ表示） -->
    <div v-if="isEditOpen" class="modal-overlay" @click.self="closeEdit">
      <div class="modal-container">
        <QuestionPopup
          :question-index="currentQuestionIndex"
          @close="closeEdit"
        />
      </div>
    </div>
  </section>
</template>