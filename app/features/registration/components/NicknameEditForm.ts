import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { navigateTo, useRoute } from '#imports'
import { DEBOUNCE_MS } from '../definitions'
import { validateUserName } from '../validation'
import { checkUserName } from '../api/check-user-name'
import { toApiError } from '~/lib/api/error'

export type UserNameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'unavailable'

/**
 * ニックネーム編集画面(待機画面から遷移)の状態と変更処理。
 * テンプレートはpages/NicknameEditForm.vue(/users/new に統合)。
 * 登録済みのニックネームを初期値としてテキストボックスに表示する。
 */
export function setupNicknameEdit() {
  // 待機画面からクエリで受け取った現在のニックネーム
  const route = useRoute()

  function queryUserName(): string {
    const name = route.query.userName
    return typeof name === 'string' && name.length > 0 ? name : 'ゲスト'
  }

  const currentName = queryUserName()

  const form = reactive({ userName: currentName })

  // --- ユーザーネーム重複チェック(登録画面と同じデバウンス+競合ガード) ---
  const userNameStatus = ref<UserNameStatus>('idle')
  const checkedUserName = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let requestId = 0

  watch(() => form.userName, (value) => {
    clearTimeout(debounceTimer)
    requestId++
    checkedUserName.value = ''

    // 元の名前から変わっていない場合はチェックせず待機に戻す
    if (value === currentName) {
      userNameStatus.value = 'idle'
      return
    }

    // ローカル違反(文字数・NG語)はAPIを叩かず即表示
    const localError = validateUserName(value)
    if (localError !== '') {
      userNameStatus.value = 'invalid'
      return
    }

    const currentId = requestId
    userNameStatus.value = 'checking'
    debounceTimer = setTimeout(async () => {
      try {
        const result = await checkUserName(value)
        if (currentId !== requestId) {
          return // 入力が変わったので古いレスポンスは破棄
        }
        checkedUserName.value = value
        userNameStatus.value = result.available ? 'available' : 'unavailable'
      }
      catch {
        if (currentId === requestId) {
          userNameStatus.value = 'unavailable'
        }
      }
    }, DEBOUNCE_MS)
  })

  onUnmounted(() => {
    clearTimeout(debounceTimer)
  })

  const userNameMessage = computed(() => {
    switch (userNameStatus.value) {
      case 'invalid':
        return validateUserName(form.userName)
      case 'checking':
        return '確認中…'
      case 'available':
        return 'このニックネームは使用できます'
      case 'unavailable':
        return 'このニックネームは使用できません'
      default:
        return '変更しない場合はそのまま「変更する」を押してください'
    }
  })

  const showFieldErrors = ref(false)

  // --- 変更の送信 ---
  const isSubmitting = ref(false)
  const submitErrorMessage = ref('')
  const savedMessage = ref('')

  const isSubmitEnabled = computed(() =>
    !isSubmitting.value
    && validateUserName(form.userName) === '' // 名前変更なしでも押せる(現状維持で待機画面へ戻る)
    && (form.userName === currentName // 元の名前のまま、または
      || (userNameStatus.value === 'available' // 変更する場合は使用可能チェックを通す
        && checkedUserName.value === form.userName)),
  )

  async function handleSubmit() {
    showFieldErrors.value = true
    if (!isSubmitEnabled.value) {
      return
    }
    isSubmitting.value = true
    submitErrorMessage.value = ''

    try {
      // TODO: バックエンドのニックネーム更新API実装後は実API呼び出しに差し替える
      await new Promise(resolve => setTimeout(resolve, 400))
      await navigateTo({
        path: '/users/waiting',
        query: { userName: form.userName },
      })
    }
    catch (error) {
      submitErrorMessage.value = toApiError(error).message
    }
    finally {
      isSubmitting.value = false
    }
  }

  return {
    currentName,
    form,
    userNameStatus,
    userNameMessage,
    showFieldErrors,
    isSubmitEnabled,
    isSubmitting,
    submitErrorMessage,
    savedMessage,
    handleSubmit,
  }
}
