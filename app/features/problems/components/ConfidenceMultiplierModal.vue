<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, useId, watch } from 'vue'
import { fetchConfidenceMultipliers, updateConfidenceMultiplier } from '../api/client'
import {
  CONFIDENCE_LEVEL_LABELS,
  CONFIDENCE_LEVELS,
  CONFIDENCE_MULTIPLIER_MAX,
  CONFIDENCE_MULTIPLIER_MIN,
  CONFIDENCE_MULTIPLIER_STEP,
} from '../constants'
import { problemErrorMessage, validateMultiplierInput } from '../validation'
import type { ConfidenceLevel, ConfidenceMultipliers } from '../types'
import LoadingSkeleton from '~/components/LoadingSkeleton.vue'
import { toApiError } from '~/lib/api/error'

const props = withDefaults(defineProps<{
  initialMultipliers?: ConfidenceMultipliers | null
}>(), {
  initialMultipliers: null,
})

const emit = defineEmits<{
  close: []
  updated: [level: ConfidenceLevel, value: string]
}>()

interface LevelRow {
  level: ConfidenceLevel
  label: string
  baseline: string
  input: string
  errorMessage: string
  isSubmitting: boolean
  savedMessage: string
}

const rows = reactive<LevelRow[]>(CONFIDENCE_LEVELS.map(level => ({
  level,
  label: CONFIDENCE_LEVEL_LABELS[level],
  baseline: '',
  input: '',
  errorMessage: '',
  isSubmitting: false,
  savedMessage: '',
})))

const isLoading = ref(props.initialMultipliers == null)
const isRefreshing = ref(false)
const loadErrorMessage = ref('')
const titleId = useId()
const panelRef = ref<HTMLElement | null>(null)
let hasDisplayedData = false
let isFetchInFlight = false

function applyMultipliers(current: ConfidenceMultipliers) {
  for (const row of rows) {
    row.baseline = current[row.level]
    row.input = current[row.level]
  }
  hasDisplayedData = true
}

watch(() => props.initialMultipliers, (initialMultipliers) => {
  if (initialMultipliers == null || hasDisplayedData) return
  applyMultipliers(initialMultipliers)
  isLoading.value = false
  if (isFetchInFlight) isRefreshing.value = true
}, { immediate: true })

async function load() {
  isFetchInFlight = true
  if (hasDisplayedData) isRefreshing.value = true
  else isLoading.value = true
  loadErrorMessage.value = ''
  try {
    const current = await fetchConfidenceMultipliers()
    applyMultipliers(current)
  }
  catch (error) {
    const apiError = toApiError(error)
    loadErrorMessage.value = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    isFetchInFlight = false
    isLoading.value = false
    isRefreshing.value = false
  }
}

function isRowSubmittable(row: LevelRow): boolean {
  return !row.isSubmitting
    && row.input !== row.baseline
    && validateMultiplierInput(row.input, CONFIDENCE_MULTIPLIER_MIN, CONFIDENCE_MULTIPLIER_MAX) === ''
}

async function handleSave(row: LevelRow) {
  row.savedMessage = ''
  row.errorMessage = ''
  const validationError = validateMultiplierInput(row.input, CONFIDENCE_MULTIPLIER_MIN, CONFIDENCE_MULTIPLIER_MAX)
  if (validationError !== '') {
    row.errorMessage = validationError
    return
  }

  row.isSubmitting = true
  try {
    const value = Number(row.input)
    const saved = await updateConfidenceMultiplier(row.level, value)
    row.baseline = saved[row.level]
    row.input = saved[row.level]
    row.savedMessage = `${row.label} を ×${saved[row.level]} に変更しました`
    emit('updated', row.level, saved[row.level])
  }
  catch (error) {
    const apiError = toApiError(error)
    row.errorMessage = problemErrorMessage(apiError.statusCode, apiError.message)
  }
  finally {
    row.isSubmitting = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  panelRef.value?.focus()
  document.addEventListener('keydown', handleKeydown)
  void load()
})
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="multiplier-modal" @click.self="emit('close')">
    <div ref="panelRef" class="multiplier-modal-panel" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
      <div class="multiplier-modal-head">
        <h2 :id="titleId">自信度倍率の設定</h2>
        <button type="button" class="multiplier-modal-close" aria-label="閉じる" @click="emit('close')">×</button>
      </div>
      <p class="muted-copy multiplier-modal-note">
        回答時に選ぶ自信度（あり・普通・なし）ごとの倍率です。すべての問題に共通で適用されます。0〜{{ CONFIDENCE_MULTIPLIER_MAX }}・小数第2位まで。
      </p>

      <ul v-if="isLoading" class="multiplier-modal-rows multiplier-modal-rows-skeleton" role="status" aria-busy="true">
        <li v-for="level in CONFIDENCE_LEVELS" :key="level" class="multiplier-modal-row">
          <LoadingSkeleton class="multiplier-row-skeleton-label" />
          <LoadingSkeleton class="multiplier-row-skeleton-input" />
        </li>
        <span class="visually-hidden">倍率を読み込み中…</span>
      </ul>
      <template v-else>
        <p v-if="isRefreshing" class="multiplier-refresh-status" role="status" aria-busy="true">最新の倍率を更新中…</p>
        <div v-if="loadErrorMessage">
          <p class="status-message error" role="alert">倍率の更新に失敗しました。{{ loadErrorMessage }}</p>
          <button type="button" class="retry-button" @click="load">再読み込み</button>
        </div>
      </template>
      <ul v-if="!isLoading" class="multiplier-modal-rows">
        <li v-for="row in rows" :key="row.level" class="multiplier-modal-row">
          <div class="multiplier-modal-row-controls">
            <span class="multiplier-modal-row-label">{{ row.label }}</span>
            <label class="multiplier-input-label">
              <span class="visually-hidden">{{ row.label }}の自信度倍率</span>
              <div class="multiplier-input-row">
                <span aria-hidden="true">×</span>
                <input v-model="row.input" type="number" inputmode="decimal" :min="CONFIDENCE_MULTIPLIER_MIN" :max="CONFIDENCE_MULTIPLIER_MAX" :step="CONFIDENCE_MULTIPLIER_STEP" :disabled="row.isSubmitting">
              </div>
            </label>
            <button type="button" class="submit-button multiplier-modal-save" :class="{ 'is-submitting': row.isSubmitting }" :disabled="!isRowSubmittable(row)" @click="handleSave(row)">
              {{ row.isSubmitting ? '保存中…' : '保存' }}
            </button>
          </div>
          <p v-if="row.savedMessage" class="status-message success" role="status">{{ row.savedMessage }}</p>
          <p v-if="row.errorMessage" class="status-message error" role="alert">{{ row.errorMessage }}</p>
        </li>
      </ul>

      <div class="multiplier-modal-actions"><button type="button" class="button-cancel" @click="emit('close')">閉じる</button></div>
    </div>
  </div>
</template>
