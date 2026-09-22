<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { deleteOperatorParticipant, fetchOperatorParticipants } from '~/features/operator-participants/api/client'
import type { OperatorParticipant } from '~/features/operator-participants/types'
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS, STUDENT_TYPE_OPTIONS } from '~/features/participants/definitions'
import ParticipantDeleteDialog from '~/features/operator-participants/components/ParticipantDeleteDialog.vue'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import { toApiError } from '~/lib/api/error'
import { setupAdminSidebar } from '~/features/admin/components/AdminSidebar'
import '~/assets/css/management.css'

useSeoMeta({
  title: '参加者管理',
  description: '登録済みの参加者を一覧で確認し、不適切・不要な参加者を削除できます。',
})

const participants = ref<OperatorParticipant[]>([])
const isParticipantsLoading = ref(true)
const isParticipantsRefreshing = ref(false)
const hasLoadedParticipants = ref(false)
const participantsErrorMessage = ref('')
const deletingParticipant = ref<OperatorParticipant | null>(null)
const isDeleting = ref(false)
const deleteErrorMessage = ref('')
const deleteSuccessMessage = ref('')
const {
  isSidebarExpanded,
  toggleSidebar,
  handleSidebarKeydown,
} = setupAdminSidebar()

const registeredAtFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function optionLabel(options: { value: string, label: string }[], value: string): string {
  return options.find(option => option.value === value)?.label ?? value
}

function genderLabel(value: string): string {
  return optionLabel(GENDER_OPTIONS, value)
}

function ageGroupLabel(value: string): string {
  return optionLabel(AGE_GROUP_OPTIONS, value)
}

function studentTypeLabel(value: string): string {
  return optionLabel(STUDENT_TYPE_OPTIONS, value)
}

function schoolDepartment(participant: OperatorParticipant): string {
  const parts = [participant.school, participant.department].filter(part => part.length > 0)
  return parts.length > 0 ? parts.join(' / ') : '—'
}

function formatRegisteredAt(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : registeredAtFormatter.format(date)
}

function participantsError(error: unknown): string {
  const apiError = toApiError(error)
  if (apiError.statusCode === 401 || apiError.statusCode === 403) return '参加者管理を利用する権限がありません。運営者アカウントでログインし直してください。'
  return `参加者一覧の取得に失敗しました。${apiError.message}`
}

function deleteError(error: unknown): string {
  const apiError = toApiError(error)
  if (apiError.statusCode === 404) return 'この参加者はすでに削除されています。'
  if (apiError.statusCode === 401 || apiError.statusCode === 403) return '参加者を削除する権限がありません。'
  return `参加者の削除に失敗しました。${apiError.message}`
}

async function loadParticipants() {
  const isInitialLoad = !hasLoadedParticipants.value
  hasLoadedParticipants.value = true
  if (isInitialLoad) isParticipantsLoading.value = true
  else isParticipantsRefreshing.value = true
  participantsErrorMessage.value = ''
  try {
    participants.value = await fetchOperatorParticipants()
  }
  catch (error) {
    participantsErrorMessage.value = participantsError(error)
  }
  finally {
    if (isInitialLoad) isParticipantsLoading.value = false
    else isParticipantsRefreshing.value = false
  }
}

function openDeleteDialog(participant: OperatorParticipant) {
  deletingParticipant.value = participant
  deleteErrorMessage.value = ''
}

function closeDeleteDialog() {
  if (isDeleting.value) return
  deletingParticipant.value = null
  deleteErrorMessage.value = ''
}

async function confirmDelete() {
  const participant = deletingParticipant.value
  if (participant == null || isDeleting.value) return

  isDeleting.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteOperatorParticipant(participant.id)
    participants.value = participants.value.filter(item => item.id !== participant.id)
    deleteSuccessMessage.value = `「${participant.displayName}」を削除しました。`
    deletingParticipant.value = null
    void loadParticipants()
  }
  catch (error) {
    deleteErrorMessage.value = deleteError(error)
    // 一部が既に削除済み(404)の場合は最新の一覧に揃える。
    if (toApiError(error).statusCode === 404) void loadParticipants()
  }
  finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  void loadParticipants()
})
</script>

<template>
  <main class="page-shell admin-shell">
    <!-- 常設サイドバー。各管理画面共通のナビ。ボタンを押すとメニュー部分を完全に隠す -->
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--collapsed': !isSidebarExpanded }"
      aria-label="管理機能メニュー"
      @keydown="handleSidebarKeydown"
    >
      <div class="admin-sidebar-head">
        <button
          type="button"
          class="admin-sidebar-toggle"
          :aria-label="isSidebarExpanded ? 'メニューを隠す' : 'メニューを表示する'"
          :aria-expanded="isSidebarExpanded"
          @click="toggleSidebar"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <p v-if="isSidebarExpanded" class="admin-sidebar-title">メニュー</p>
      </div>
      <nav v-if="isSidebarExpanded" class="admin-sidebar-nav">
        <NuxtLink class="admin-sidebar-link" to="/event_operator">運営者メイン</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/voting-rate">投票率ページ</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/quiz-control">出題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/management">問題管理</NuxtLink>
        <NuxtLink class="admin-sidebar-link" to="/event_operator/participants">参加者管理</NuxtLink>
      </nav>
    </aside>

    <section class="admin-card problems-card" aria-labelledby="participants-title">
      <header class="problems-header">
        <div>
          <p class="eyebrow">Participant management</p>
          <h1 id="participants-title">参加者管理</h1>
          <p class="muted-copy">登録済みの参加者を確認できます。削除すると、その参加者の回答・セッション・リアクションもすべて削除されます。</p>
        </div>
        <button type="button" class="primary-link add-question-link" :disabled="isParticipantsRefreshing" @click="loadParticipants">
          {{ isParticipantsRefreshing ? '更新中…' : '一覧を更新' }}
        </button>
      </header>

      <div class="question-count-row">
        <div class="question-count-group">
          <p v-if="!isParticipantsLoading && (!participantsErrorMessage || participants.length > 0)" class="question-count" role="status">全 {{ participants.length }} 名</p>
        </div>
      </div>

      <p v-if="deleteSuccessMessage" class="status-message success" role="status">{{ deleteSuccessMessage }}</p>
      <div v-if="isParticipantsRefreshing" class="question-refresh-status" role="status" aria-busy="true">
        参加者一覧を更新中…
      </div>
      <div v-else-if="participantsErrorMessage && participants.length > 0" class="question-refresh-status is-error" role="alert">
        参加者一覧の更新に失敗しました。{{ participantsErrorMessage }}
        <button type="button" class="retry-button" @click="loadParticipants">再読み込み</button>
      </div>

      <div
        v-if="isParticipantsLoading"
        class="question-list question-list-skeleton"
        role="status"
        aria-busy="true"
      >
        <span class="visually-hidden">参加者を読み込み中…</span>
        <div class="question-rows">
          <div v-for="index in 5" :key="index" class="question-row question-row-skeleton">
            <LoadingSkeleton class="question-skeleton-id" />
            <LoadingSkeleton class="question-skeleton-text" />
            <LoadingSkeleton class="question-skeleton-badge" />
          </div>
        </div>
      </div>
      <div v-else-if="participantsErrorMessage && participants.length === 0" class="questions-error">
        <p class="status-message error" role="alert">{{ participantsErrorMessage }}</p>
        <button type="button" class="retry-button" @click="loadParticipants">参加者を再読み込み</button>
      </div>
      <p v-else-if="participants.length === 0" class="status-message empty" role="status">
        登録されている参加者がいません。
      </p>
      <div v-if="!isParticipantsLoading && participants.length > 0" class="question-list">
        <div class="question-rows">
          <div v-for="participant in participants" :key="participant.id" class="question-row participant-row">
            <div class="participant-row-summary">
              <span class="participant-name">{{ participant.displayName }}</span>
              <span class="participant-meta">{{ genderLabel(participant.gender) }} / {{ ageGroupLabel(participant.ageGroup) }} / {{ studentTypeLabel(participant.studentType) }}</span>
              <span class="participant-meta participant-school">{{ schoolDepartment(participant) }}</span>
              <span class="points-badge">回答 {{ participant.answeredCount }}問</span>
              <span class="participant-registered">{{ formatRegisteredAt(participant.registeredAt) }} 登録</span>
              <button
                type="button"
                class="row-action-button"
                :aria-label="`参加者「${participant.displayName}」を削除`"
                @click="openDeleteDialog(participant)"
              >削除</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ParticipantDeleteDialog
      v-if="deletingParticipant"
      :participant="deletingParticipant"
      :is-deleting="isDeleting"
      :error-message="deleteErrorMessage"
      @close="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </main>
</template>

<style scoped>
.participant-row { padding: 12px 16px; }
.participant-row-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.participant-name { font-weight: 700; color: #253750; overflow-wrap: anywhere; }
.participant-meta { color: #516176; font-size: 13px; }
.participant-school { flex: 1 1 200px; overflow-wrap: anywhere; }
.participant-registered { color: #6b7a90; font-size: 12px; }
</style>
